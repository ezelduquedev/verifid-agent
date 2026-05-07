const Tesseract = require('tesseract.js');

/**
 * Servicio de extracción de texto mediante OCR (RF-03)
 * @param {Buffer} imageBuffer - El archivo de imagen en memoria enviado desde el controlador
 */
const runOCR = async (imageBuffer) => {
  try {
    // Tesseract.js acepta buffers directamente, ideal para el memoryStorage de Multer
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'spa', // Idioma configurado en español para DNI/NIE
      { 
        logger: m => {
          // Solo mostramos el progreso de reconocimiento para no saturar la consola[cite: 2]
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progreso: ${Math.round(m.progress * 100)}%`);
          }
        } 
      }
    );
    
    return text;
  } catch (error) {
    console.error("Error crítico en el motor OCR:", error);
    // Devolvemos null para que el flujo de verificación no se rompa totalmente[cite: 2]
    return null; 
  }
};

// Exportamos como runOCR para que coincida con el require de tu controlador[cite: 2]
module.exports = { runOCR };