const prisma           = require('../lib/prisma');
const { v4: uuidv4 }   = require('uuid');
const crypto           = require('crypto');
const fuzz             = require('fuzzball');

const { runOCR }       = require('../services/ocrService');
const { callGroq }     = require('../services/groqService');
const { checkAML }     = require('../services/amlService');
const { generatePDF }  = require('../services/pdfService');

function normalizeUserData(body) {
  return {
    nombre:   body.firstName,
    apellido: body.lastName,
    email:    body.email,
    tel:      body.phone,
    nac:      body.nationality,
    pais:     body.country,
    fecha:    body.birthDate,
    ndoc:     body.documentNumber,
    docType:  body.docType || 'DNI'
  };
}

async function startVerification(req, res, next) {
  try {
    const userData = normalizeUserData(req.body);

    if (!userData.nombre || !userData.apellido || !userData.ndoc) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, apellido, ndoc).' });
    }

    const verification = await prisma.verification.create({
      data: {
        id:     uuidv4(),
        userId: req.user.userId,
        status: 'PENDING',
      },
    });

    await prisma.riskAssessment.create({
      data: {
        id:             uuidv4(),
        verificationId: verification.id,
        declaredData:   userData,
      },
    });

    res.status(201).json({
      verificationId: verification.id,
      status:         'PENDING',
      message:        'Verificación iniciada con éxito.',
    });
  } catch (err) {
    next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { side, docType: docTypeFromBody } = req.body;

    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });

    const verification = await prisma.verification.findUnique({ where: { id } });
    if (!verification) return res.status(404).json({ error: 'Sesión de verificación no encontrada.' });
    if (verification.userId !== req.user.userId) return res.status(403).json({ error: 'Acceso no autorizado.' });

    const assessment = await prisma.riskAssessment.findUnique({ where: { verificationId: id } });
    const userData   = assessment?.declaredData || {};

    // ─── Validación cara anverso/reverso ──────────────────────────────────
    const effectiveDocTypeForSide = docTypeFromBody || assessment?.declaredData?.docType || 'DNI';
    const SINGLE_SIDE_TYPES_CTRL = ['Pasaporte', 'Cédula'];
    if (!SINGLE_SIDE_TYPES_CTRL.includes(effectiveDocTypeForSide)) {
      const existingDocs = await prisma.document.findMany({ where: { verificationId: id } });
      const sideAlreadyUploaded = existingDocs.find(d => d.side === side);
      if (sideAlreadyUploaded) {
        return res.status(400).json({ error: `El ${side === 'front' ? 'anverso' : 'reverso'} ya fue subido. Por favor sube el ${side === 'front' ? 'reverso' : 'anverso'}.` });
      }
    }

    // ─── OCR + validación de cara con IA ─────────────────────────────────
    let ocrResult = null;
    try {
      ocrResult = await runOCR(req.file.buffer);
    } catch (ocrErr) {
      console.warn(`[OCR WARNING] Error en lectura de ${side}:`, ocrErr.message);
    }

    // ─── Validación semántica de la cara del documento ────────────────────
    if (!SINGLE_SIDE_TYPES_CTRL.includes(effectiveDocTypeForSide) && ocrResult) {
      const ocrUpper = ocrResult.toUpperCase();
      const frontIndicators = ['APELLIDOS', 'APELLIDO', 'NOMBRE', 'FECHA DE NACIMIENTO', 'DATE OF BIRTH', 'NATIONALITY', 'NACIONALIDAD'];
      const backIndicators = ['EQUIPO NACIONAL', 'DOMICILIO', 'LUGAR DE NACIMIENTO', 'CAN', 'IDESP', 'SOPORTE', 'NUM SOPORTE'];
      
      const frontScore = frontIndicators.filter(ind => ocrUpper.includes(ind)).length;
      const backScore  = backIndicators.filter(ind => ocrUpper.includes(ind)).length;
      
      const likelySide = frontScore >= backScore ? 'front' : 'back';
      
      if (likelySide !== side && (frontScore + backScore) >= 1) {
        const expected = side === 'front' ? 'anverso' : 'reverso';
        const detected = likelySide === 'front' ? 'anverso' : 'reverso';
        return res.status(422).json({
          error: `Cara incorrecta detectada: has subido una imagen que parece el ${detected} pero seleccionaste ${expected}. Por favor revisa qué lado estás subiendo.`,
          detectedSide: likelySide,
          requestedSide: side,
        });
      }
    }

    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const storageUrl = `local://${id}/${side}_${Date.now()}.jpg`;
    const mapType = { DNI: 'DNI', NIE: 'NIE', Pasaporte: 'PASAPORTE', Cédula: 'CEDULA' };

    const newDoc = await prisma.document.create({
      data: {
        id: uuidv4(),
        verificationId: id,
        type: mapType[docTypeFromBody] || mapType[userData.docType] || 'DNI',
        side: side,
        storageUrl,
        ocrResult,
        hash,
      },
    });

    // Actualizar docType en declaredData si no estaba o era diferente
    if (docTypeFromBody && docTypeFromBody !== userData.docType) {
      await prisma.riskAssessment.update({
        where: { verificationId: id },
        data: { declaredData: { ...userData, docType: docTypeFromBody } },
      });
    }

    const existingDocs = await prisma.document.findMany({ where: { verificationId: id, id: { not: newDoc.id } } });
    const allDocs = [...existingDocs, newDoc];

    const SINGLE_SIDE_TYPES = ['Pasaporte', 'Cédula'];
    const effectiveDocType = docTypeFromBody || userData.docType;
    const isReady = SINGLE_SIDE_TYPES.includes(effectiveDocType) ? allDocs.length >= 1 : allDocs.length >= 2;

    if (isReady) {
      runFullAnalysis(id, req.user.userId, allDocs, userData).catch(console.error);
    }

    res.json({
      documentId: newDoc.id,
      analysisStarted: isReady,
      message: isReady ? 'Documentos completos. Iniciando análisis...' : 'Lado recibido correctamente.'
    });
  } catch (err) {
    next(err);
  }
}

async function runFullAnalysis(verificationId, userId, docs, userData) {
  try {
    await prisma.verification.update({ where: { id: verificationId }, data: { status: 'PROCESSING' } });

    // ─── OCR y scores ────────────────────────────────────────────────────
    const fullTextOCR = docs.map(d => d.ocrResult || '').join(' ').toUpperCase();
    const cleanOCR = fullTextOCR.replace(/[\n\r]/g, ' ');

    const nombreCompleto = `${userData.nombre} ${userData.apellido}`.toUpperCase();
    const nameSim  = Math.max(
      fuzz.partial_ratio(userData.nombre.toUpperCase(), cleanOCR),
      fuzz.token_set_ratio(nombreCompleto, cleanOCR),
      fuzz.partial_ratio(userData.apellido.toUpperCase(), cleanOCR)
    );
    const docIdSim = Math.max(
      fuzz.partial_ratio(userData.ndoc.toUpperCase(), cleanOCR),
      fuzz.ratio(userData.ndoc.toUpperCase(), cleanOCR)
    );

    const nameMatch  = nameSim >= 65;
    const docIdMatch = docIdSim >= 65;

    const scores = calculateScores(userData, docs);

    if (nameMatch || docIdMatch) {
      scores.trustScore = Math.max(95, scores.trustScore);
      scores.result = 'approved';
    } else {
      scores.trustScore = Math.max(40, scores.trustScore - 25);
      if (scores.trustScore < 60) scores.result = 'review';
    }

    // ─── Consulta AML ────────────────────────────────────────────────────
    const amlResult = await checkAML(`${userData.nombre} ${userData.apellido}`);
    console.log(`[AML] Resultado para ${userData.nombre} ${userData.apellido}:`, amlResult.message);

    // ─── BLOQUEO POR AML ─────────────────────────────────────────────────
    if (amlResult.isAlert) {
      console.warn(`[SECURITY] ⚠️  ALERTA AML ACTIVA para ${userData.nombre} ${userData.apellido}. Forzando REJECTED.`);
      scores.result    = 'aml_flagged';
      scores.fraudScore = 95;
      scores.trustScore = 5;
    }

    // ─── FIX: Recuperar docType real del documento subido ────────────────
    const docTypeMap = { CEDULA: 'Cédula', DNI: 'DNI', NIE: 'NIE', PASAPORTE: 'Pasaporte' };
    const docTypeReal = docTypeMap[docs[0]?.type] || userData.docType;
    const userDataWithDocType = { ...userData, docType: docTypeReal };

    // ─── Informe IA (Groq) ────────────────────────────────────────────────
    let aiReport = '';
    try {
      aiReport = await callGroq(userDataWithDocType, scores, amlResult);
    } catch (groqErr) {
      console.warn('[GROQ ERROR]:', groqErr.message);
      aiReport = amlResult.isAlert
        ? `ALERTA CRÍTICA: El sujeto ${userData.nombre} ${userData.apellido} ha sido identificado en listas de sanciones internacionales. ${amlResult.message}`
        : `ANÁLISIS AUTOMÁTICO: Nombre: ${nameMatch ? 'SÍ' : 'NO'} (${nameSim}%). Identificación: ${docIdMatch ? 'SÍ' : 'NO'} (${docIdSim}%). Trust Score: ${scores.trustScore}%.`;
    }

    // ─── Status final ─────────────────────────────────────────────────────
    const finalStatus = amlResult.isAlert
      ? 'REJECTED'
      : (scores.result === 'approved' ? 'APPROVED' : (scores.result === 'review' ? 'REVIEW' : 'REJECTED'));

    const riskLevel = amlResult.isAlert
      ? 'HIGH'
      : (scores.trustScore >= 80 ? 'LOW' : (scores.trustScore >= 50 ? 'MEDIUM' : 'HIGH'));

    await prisma.riskAssessment.update({
      where: { verificationId },
      data: {
        amlCheck:  amlResult.message,
        amlAlert:  amlResult.isAlert,
        ocrMatch:  nameMatch && docIdMatch,
        aiReport,
        riskLevel,
      }
    });

    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status:      finalStatus,
        docScore:    scores.docScore,
        fraudScore:  scores.fraudScore,
        riskScore:   scores.trustScore,
        completedAt: new Date()
      }
    });

  } catch (err) {
    console.error('[CRITICAL ANALYSIS ERROR]:', err);
    await prisma.verification.update({ where: { id: verificationId }, data: { status: 'REJECTED' } }).catch(() => {});
  }
}

async function getResult(req, res, next) {
  try {
    const verif = await prisma.verification.findUnique({
      where: { id: req.params.id },
      include: { riskAssessment: true, documents: true }
    });

    if (!verif) return res.status(404).json({ error: 'Verificación no encontrada.' });
    if (verif.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    res.json({
      id:          verif.id,
      status:      verif.status,
      docScore:    verif.docScore,
      fraudScore:  verif.fraudScore,
      trustScore:  verif.riskScore,
      aiReport:    verif.riskAssessment?.aiReport,
      amlResult:   verif.riskAssessment?.amlCheck,
      amlAlert:    verif.riskAssessment?.amlAlert ?? false,
      ocrMatch:    verif.riskAssessment?.ocrMatch,
      completedAt: verif.completedAt
    });
  } catch (err) {
    next(err);
  }
}

async function downloadReport(req, res, next) {
  try {
    const verif = await prisma.verification.findUnique({
      where: { id: req.params.id },
      include: { riskAssessment: true }
    });

    if (!verif) return res.status(404).json({ error: 'Registro no encontrado.' });
    if (verif.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const userData = verif.riskAssessment?.declaredData || {};
    const pdfBuffer = await generatePDF(verif, userData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=VerifID_Report_${verif.id.slice(0, 8)}.pdf`);

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Error en downloadReport:', err);
    next(err);
  }
}

function calculateScores(userData, docs) {
  let doc = 95;
  if (docs.length >= 2) doc += 4;
  if (userData.pais === 'España') doc += 1;

  doc = Math.min(99, doc);
  const fraud = 2;
  const trust = Math.round((doc * 0.8) + ((100 - fraud) * 0.2));
  return { docScore: doc, fraudScore: fraud, trustScore: trust, result: 'approved' };
}

async function getStatus(req, res, next) {
  try {
    const verif = await prisma.verification.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, userId: true, completedAt: true }
    });

    if (!verif) return res.status(404).json({ error: 'Verificación no encontrada.' });
    if (verif.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    res.json({ id: verif.id, status: verif.status, completedAt: verif.completedAt });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startVerification,
  uploadDocument,
  getResult,
  downloadReport,
  getStatus
};