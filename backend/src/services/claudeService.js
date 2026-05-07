const fetch = require('node-fetch');

/**
 * Proxy seguro hacia la API de Claude (Anthropic).
 * La clave nunca sale del servidor — resuelve la vulnerabilidad del frontend.
 *
 * @param {object} userData  — Datos personales del usuario
 * @param {object} scores    — { docScore, fraudScore, trustScore, result }
 * @param {string} amlResult — Resultado del cruce AML/PEP
 * @returns {string} Informe narrativo generado por Claude
 */
async function callClaude(userData, scores, amlResult) {
  const { nombreCompleto = `${userData.nombre} ${userData.apellido}`, ndoc, docType, nac } = userData;
  const { docScore, fraudScore, trustScore, result } = scores;

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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Claude API error ${response.status}: ${err.error?.message || 'Unknown'}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

module.exports = { callClaude };
