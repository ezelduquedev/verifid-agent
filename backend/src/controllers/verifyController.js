const prisma           = require('../lib/prisma');
const { v4: uuidv4 }   = require('uuid');
const crypto           = require('crypto');
const fuzz             = require('fuzzball'); 

const { runOCR }       = require('../services/ocrService');
const { callClaude }   = require('../services/claudeService');
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
    // FIX: leer también docType desde el body del upload
    const { side, docType: docTypeFromBody } = req.body;

    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });

    const verification = await prisma.verification.findUnique({ where: { id } });
    if (!verification) return res.status(404).json({ error: 'Sesión de verificación no encontrada.' });
    if (verification.userId !== req.user.userId) return res.status(403).json({ error: 'Acceso no autorizado.' });

    const assessment = await prisma.riskAssessment.findUnique({ where: { verificationId: id } });
    const userData   = assessment?.declaredData || {};

    let ocrResult = null;
    try {
      ocrResult = await runOCR(req.file.buffer);
    } catch (ocrErr) {
      console.warn(`[OCR WARNING] Error en lectura de ${side}:`, ocrErr.message);
    }

    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const storageUrl = `local://${id}/${side}_${Date.now()}.jpg`;
    const mapType = { DNI: 'DNI', NIE: 'NIE', Pasaporte: 'PASAPORTE', Cédula: 'CEDULA' };

    const newDoc = await prisma.document.create({
      data: {
        id: uuidv4(),
        verificationId: id,
        type: mapType[userData.docType] || 'DNI',
        storageUrl,
        ocrResult,
        hash,
      },
    });

    const existingDocs = await prisma.document.findMany({ where: { verificationId: id, id: { not: newDoc.id } } });
    const allDocs = [...existingDocs, newDoc];

    // FIX: usar docType del body como fuente principal, con fallback a declaredData
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

    const fullTextOCR = docs.map(d => d.ocrResult || '').join(' ').toUpperCase();
    const cleanOCR = fullTextOCR.replace(/[\n\r]/g, ' ');

    const nameSim  = fuzz.partial_ratio(userData.nombre.toUpperCase(), cleanOCR);
    const docIdSim = fuzz.partial_ratio(userData.ndoc.toUpperCase(), cleanOCR);
    
    const nameMatch  = nameSim >= 75;
    const docIdMatch = docIdSim >= 75;

    const scores = calculateScores(userData, docs);

    if (nameMatch || docIdMatch) {
      scores.trustScore = Math.max(95, scores.trustScore); 
      scores.result = 'approved';
    } else {
      scores.trustScore = Math.max(40, scores.trustScore - 25);
      if (scores.trustScore < 60) scores.result = 'review';
    }

    const amlResult = await checkAML(`${userData.nombre} ${userData.apellido}`);
    
    let aiReport = "";
    try {
      aiReport = await callClaude(userData, scores, amlResult);
    } catch (claudeErr) {
      console.warn("[CLAUDE ERROR]:", claudeErr.message);
      aiReport = `ANÁLISIS AUTOMÁTICO: Nombre: ${nameMatch ? 'SÍ' : 'NO'} (${nameSim}%). Identificación: ${docIdMatch ? 'SÍ' : 'NO'} (${docIdSim}%). Trust Score: ${scores.trustScore}%.`;
    }

    const finalStatus = scores.result === 'approved' ? 'APPROVED' : (scores.result === 'review' ? 'REVIEW' : 'REJECTED');
    const riskLevel = scores.trustScore >= 80 ? 'LOW' : (scores.trustScore >= 50 ? 'MEDIUM' : 'HIGH');

    await prisma.riskAssessment.update({
      where: { verificationId },
      data: { amlCheck: amlResult, ocrMatch: nameMatch && docIdMatch, aiReport, riskLevel }
    });

    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: finalStatus,
        docScore: scores.docScore,
        fraudScore: scores.fraudScore,
        riskScore: scores.trustScore,
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
      id: verif.id,
      status: verif.status,
      docScore: verif.docScore,
      fraudScore: verif.fraudScore,
      trustScore: verif.riskScore,
      aiReport: verif.riskAssessment?.aiReport,
      amlResult: verif.riskAssessment?.amlCheck,
      ocrMatch: verif.riskAssessment?.ocrMatch,
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
    console.error("Error en downloadReport:", err);
    next(err);
  }
}

function calculateScores(userData, docs) {
  let doc = 95;
  if (docs.length >= 2) doc += 4;
  if (userData.pais === 'España') doc += 1;
  
  doc = Math.min(99, doc);
  let fraud = 2;

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