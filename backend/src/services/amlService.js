const fetch = globalThis.fetch || require('node-fetch');

async function checkAML(nombreCompleto) {
  const apiKey = process.env.OPENSANCTIONS_API_KEY;
  const nombreParaAnalisis = (nombreCompleto || "").trim().toUpperCase();

  // ─── MODO SIMULACIÓN ────────────────────────────────────────────────────
  if (!apiKey || apiKey === 'tu_key_aqui' || apiKey === '') {
    console.warn(`[AML SERVICE] Modo Simulación activo para: ${nombreParaAnalisis}`);

    const listaNegraSimulada = [
      'BIN LADEN', 'KADHAFI', 'TEST FRAUD', 'NICOLAS MADURO', 'PABLO ESCOBAR'
    ];

    const coincidencia = listaNegraSimulada.some(s => nombreParaAnalisis.includes(s));

    if (coincidencia) {
      return `COINCIDENCIA ENCONTRADA (Simulado): El sujeto ${nombreParaAnalisis} figura en listas de vigilancia de alto riesgo.`;
    }

    return "SIN COINCIDENCIAS: El usuario no figura en listas de sanciones internacionales (Simulado).";
  }

  // ─── CONSULTA REAL (OPENSANCTIONS API) ──────────────────────────────────
  try {
    const url = `https://api.opensanctions.org/search/default?q=${encodeURIComponent(nombreParaAnalisis)}&limit=5`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 402) {
      console.warn('[AML SERVICE] Límite de la API trial alcanzado. Activando simulación.');
      return "REVISIÓN MANUAL REQUERIDA: Límite del plan trial alcanzado.";
    }

    if (!response.ok) {
      throw new Error(`OpenSanctions respondió con status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AML DEBUG]', JSON.stringify(data.results?.slice(0, 2), null, 2));

    if (data.results && data.results.length > 0) {
      const topMatch = data.results[0];

      if (topMatch.score > 0.8) {
        return `ALERTA AML: Coincidencia detectada con "${topMatch.caption}". Entidad: ${topMatch.schema}. Score: ${Math.round(topMatch.score * 100)}%`;
      }
    }

    return "LIMPIO: No se encontraron coincidencias en listas de sanciones internacionales.";

  } catch (error) {
    console.error("[AML SERVICE] Error:", error.message);
    return "REVISIÓN MANUAL REQUERIDA: No se pudo conectar con el servicio de sanciones. (Error Técnico).";
  }
}

module.exports = { checkAML };