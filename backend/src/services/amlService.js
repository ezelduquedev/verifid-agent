const fetch = globalThis.fetch || require('node-fetch');

/**
 * Servicio de Verificación AML (Anti-Money Laundering) y PEP.
 * Consulta listas de sanciones internacionales y PEP (Politically Exposed Persons).
 */
async function checkAML(nombreCompleto) {
  // Obtenemos la API Key desde las variables de entorno
  const apiKey = process.env.OPENSANCTIONS_API_KEY;
  
  // Normalizamos el nombre para evitar errores con nulos o indefinidos
  const nombreParaAnalisis = (nombreCompleto || "").trim().toUpperCase();

  // ─── MODO SIMULACIÓN / FALLBACK ─────────────────────────────────────────
  // Se activa si no hay API Key configurada o es la de ejemplo.
  // Útil para desarrollo local y defensa del proyecto (demo).
  if (!apiKey || apiKey === 'tu_key_aqui' || apiKey === '') {
    console.warn(`[AML SERVICE] Modo Simulación activo para: ${nombreParaAnalisis}`);
    
    // Lista de nombres de prueba para demostrar que el sistema bloquea criminales
    const listaNegraSimulada = [
      'BIN LADEN', 
      'KADHAFI', 
      'TEST FRAUD', 
      'NICOLAS MADURO', 
      'PABLO ESCOBAR'
    ];
    
    // Verificamos si el nombre del usuario contiene alguno de la lista negra
    const coincidencia = listaNegraSimulada.some(sujeto => 
      nombreParaAnalisis.includes(sujeto)
    );

    if (coincidencia) {
      return `COINCIDENCIA ENCONTRADA (Simulado): El sujeto ${nombreParaAnalisis} figura en listas de vigilancia de alto riesgo.`;
    }

    return "SIN COINCIDENCIAS: El usuario no figura en listas de sanciones internacionales (Simulado).";
  }

  // ─── CONSULTA REAL (OPENSANCTIONS API) ──────────────────────────────────
  try {
    // Consulta a la base de datos global de OpenSanctions (Requisito de cumplimiento)
    const url = `https://api.opensanctions.org/search/default/?q=${encodeURIComponent(nombreParaAnalisis)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenSanctions respondió con status: ${response.status}`);
    }

    const data = await response.json();
    
    // El 'score' indica la probabilidad de coincidencia (0.0 a 1.0)
    // Usamos un umbral de 0.8 para evitar falsos positivos
    if (data.results && data.results.length > 0) {
      const topMatch = data.results[0];
      
      if (topMatch.score > 0.8) {
        return `ALERTA AML: Coincidencia detectada con "${topMatch.caption}". Entidad: ${topMatch.schema}. Score: ${Math.round(topMatch.score * 100)}%`;
      }
    }

    return "LIMPIO: No se encontraron coincidencias en listas de sanciones internacionales.";

  } catch (error) {
    console.error("Error crítico en amlService:", error.message);
    
    // En caso de error de red, devolvemos un estado neutral que requiera revisión manual
    // para no bloquear el flujo de negocio pero manteniendo la seguridad.
    return "REVISIÓN MANUAL REQUERIDA: No se pudo conectar con el servicio de sanciones. (Error Técnico).";
  }
}

module.exports = { checkAML };