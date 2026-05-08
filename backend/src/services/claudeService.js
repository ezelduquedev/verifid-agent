const fetch = require('node-fetch');

/**
 * Genera un informe KYC local cuando la API de Claude no está disponible.
 * Produce texto profesional basado en los scores y datos del usuario.
 */
function generateLocalReport(userData, scores, amlResult) {
  const nombre = `${userData.nombre} ${userData.apellido}`;
  const { docScore, fraudScore, trustScore, result } = scores;
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  if (result === 'approved') {
    return `Informe de verificación KYC emitido el ${fecha}. ` +
      `El proceso de identificación del sujeto ${nombre} ha concluido satisfactoriamente. ` +
      `La autenticidad documental ha sido evaluada con una puntuación de ${docScore}%, ` +
      `el índice de riesgo de fraude se sitúa en ${fraudScore}% y la confianza global del sistema alcanza el ${trustScore}%. ` +
      `La verificación AML arroja el siguiente resultado: ${amlResult}. ` +
      `En base a los indicadores analizados, se recomienda la APROBACIÓN de la solicitud sin necesidad de revisión adicional.`;
  }

  if (result === 'review') {
    return `Informe de verificación KYC emitido el ${fecha}. ` +
      `El análisis del sujeto ${nombre} ha generado incertidumbre en alguno de los parámetros evaluados. ` +
      `La confianza global es del ${trustScore}%, lo que se encuentra por debajo del umbral de aprobación automática. ` +
      `Resultado AML: ${amlResult}. ` +
      `Se recomienda REVISIÓN MANUAL por parte de un agente de cumplimiento antes de tomar una decisión definitiva.`;
  }

  return `Informe de verificación KYC emitido el ${fecha}. ` +
    `El proceso de verificación ha concluido con resultado RECHAZADO. ` +
    `La confianza global del sistema es del ${trustScore}% y el índice de riesgo de fraude es del ${fraudScore}%. ` +
    `Resultado AML: ${amlResult}. ` +
    `Los indicadores de riesgo detectados no permiten validar la identidad del solicitante de forma automática.`;
}

/**
 * Llama a la API de Claude. Si no está disponible o la key es inválida,
 * genera un informe local profesional como fallback.
 */
async function callClaude(userData, scores, amlResult) {
  const { nombreCompleto = `${userData.nombre} ${userData.apellido}`, ndoc, docType, nac } = userData;
  const { docScore, fraudScore, trustScore, result } = scores;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback inmediato si no hay key configurada
  if (!apiKey || apiKey === 'tu_key_aqui' || apiKey === '') {
    console.warn('[CLAUDE] Sin API key — usando informe local.');
    return generateLocalReport(userData, scores, amlResult);
  }

  const prompts = {
    approved: `Eres un agente KYC profesional. Emite un informe de verificación APROBADO en español para:
- Nombre: ${nombreCompleto}
- Nacionalidad: ${nac}
- Documento: ${docType} ${ndoc}
- Autenticidad documental: ${docScore}%
- Riesgo de fraude: ${fraudScore}%
- Confianza global: ${trustScore}%
- Resultado AML/PEP: ${amlResult}
El informe debe ser conciso (3-4 frases), profesional y sin usar markdown.`,

    review: `Eres un agente KYC profesional. Emite un informe de REVISIÓN MANUAL en español para:
- Nombre: ${nombreCompleto}
- Autenticidad: ${docScore}%, Fraude: ${fraudScore}%, Confianza: ${trustScore}%
- AML/PEP: ${amlResult}
Señala los factores que generan incertidumbre y recomienda los pasos de revisión manual. Sin markdown.`,

    rejected: `Eres un agente KYC profesional. Emite un informe de RECHAZO en español.
- Confianza: ${trustScore}%, Riesgo: ${fraudScore}%
- AML/PEP: ${amlResult}
No menciones el nombre del usuario. Indica los indicadores de riesgo detectados. Sin markdown.`,
  };

  const prompt = prompts[result] || prompts.rejected;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Claude API error ${response.status}: ${err.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    return data.content[0].text;

  } catch (err) {
    // Fallback: si la API falla por cualquier motivo, generamos el informe localmente
    console.warn('[CLAUDE] API no disponible, usando informe local:', err.message);
    return generateLocalReport(userData, scores, amlResult);
  }
}

module.exports = { callClaude };