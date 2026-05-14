const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * Servicio de extracción de texto mediante OCR (RF-03)
 * @param {Buffer} imageBuffer - El archivo de imagen en memoria enviado desde el controlador
 */
const runOCR = async (imageBuffer) => {
  try {
    // Preprocesamiento con Sharp para mejorar la lectura de fotos de móvil:
    // - Upscale a 1800px para que Tesseract tenga más resolución
    // - Escala de grises (elimina ruido de color y holográficos)
    // - Normalise: ajuste automático de brillo y contraste
    // - Sharpen: nitidez para mejorar bordes del texto
    const processedBuffer = await sharp(imageBuffer)
      .resize({ width: 1800, withoutEnlargement: false })
      .grayscale()
      .normalise()
      .sharpen()
      .toBuffer();

    const { data: { text } } = await Tesseract.recognize(
      processedBuffer,
      'spa', // Idioma configurado en español para DNI/NIE
      {
        logger: m => {
          // Solo mostramos el progreso de reconocimiento para no saturar la consola
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progreso: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    return text;
  } catch (error) {
    console.error("Error crítico en el motor OCR:", error);
    // Devolvemos null para que el flujo de verificación no se rompa totalmente
    return null;
  }
};

module.exports = { runOCR };