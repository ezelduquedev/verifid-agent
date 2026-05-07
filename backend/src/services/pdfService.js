const PDFDocument = require('pdfkit');

/**
 * Genera un PDF en memoria y devuelve un Buffer.
 * Optimizado para reportes KYC profesionales.
 */
async function generatePDF(verif, userData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 50,
      info: { Title: `Informe VerifID - ${verif.id}` }
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // --- ENCABEZADO ---
    doc.fillColor('#1a2a6c').fontSize(22).text('VERIFID AGENT', { align: 'center', characterSpacing: 2 });
    doc.fillColor('#000').fontSize(10).text('Sistema KYC con Inteligencia Artificial', { align: 'center' });
    doc.moveDown(1.5);

    // --- BLOQUE DE RESULTADO (Dinámico) ---
    const isApproved = verif.status === 'APPROVED';
    const statusColor = isApproved ? '#27ae60' : '#e74c3c';
    
    doc.rect(50, doc.y, 500, 40).fill('#f8f9fa');
    doc.fillColor(statusColor).fontSize(16).text(`RESULTADO: ${verif.status}`, 60, doc.y + 12);
    doc.moveDown(2.5);

    // --- DETALLES DEL USUARIO ---
    doc.fillColor('#1a2a6c').fontSize(14).text('Detalles del Usuario', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#000').fontSize(11);
    doc.text(`Nombre: `, { continued: true }).font('Helvetica-Bold').text(`${userData.nombre} ${userData.apellido}`).font('Helvetica');
    doc.text(`Email: ${userData.email || 'N/A'}`);
    doc.text(`Documento: ${userData.docType} (${userData.ndoc})`);
    doc.text(`Nacionalidad: ${userData.nac}`);
    doc.moveDown();

    // --- ANÁLISIS DE RIESGO ---
    doc.fillColor('#1a2a6c').fontSize(14).text('Análisis de Riesgo', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#000').fontSize(11);
    doc.text(`Confianza Documental: ${verif.docScore}%`);
    doc.text(`Riesgo de Fraude: ${verif.fraudScore}%`);
    doc.text(`Puntuación Global de Confianza: `, { continued: true }).fillColor(statusColor).text(`${verif.riskScore}%`).fillColor('#000');
    doc.text(`Validación OCR: ${verif.riskAssessment?.ocrMatch ? 'EXITOSA (COINCIDENCIA DETECTADA)' : 'DISCREPANCIA DETECTADA'}`);
    
    // Formateo del AML para que no se salga del margen
    doc.text(`AML/PEP Status: `, { continued: true }).fontSize(10).text(verif.riskAssessment?.amlCheck || 'No procesado');
    doc.moveDown();

    // --- INFORME DE IA ---
    doc.fillColor('#1a2a6c').fontSize(14).text('Informe Narrativo de IA', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#333').fontSize(10).text(verif.riskAssessment?.aiReport || 'Sin informe narrativo disponible.', { align: 'justify' });

    // --- PIE DE PÁGINA (RGPD) ---
    const footerY = doc.page.height - 70;
    doc.moveTo(50, footerY).lineTo(550, footerY).stroke('#bdc3c7');
    doc.fontSize(8).fillColor('#888888')
       .text('Este documento ha sido generado automáticamente y contiene datos sensibles sujetos al RGPD.', 50, footerY + 10, { align: 'center' });
    doc.text(`Fecha del informe: ${new Date().toLocaleString()} | ID: ${verif.id.slice(0, 8)}`, { align: 'center' });

    doc.end();
  });
}

module.exports = { generatePDF };