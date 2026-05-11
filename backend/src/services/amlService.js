const fetch = globalThis.fetch || require('node-fetch');

// ─────────────────────────────────────────────────────────────────────────────
// LISTA NEGRA LOCAL
// Red de seguridad cuando OpenSanctions no devuelve resultados o falla.
// Cubre sujetos de alta peligrosidad internacional con variantes de nombre.
// ─────────────────────────────────────────────────────────────────────────────
const LISTA_NEGRA = [
  {
    keywords: ['PABLO ESCOBAR', 'ESCOBAR GAVIRIA', 'PABLO EMILIO ESCOBAR'],
    entity:   'Pablo Emilio Escobar Gaviria',
    level:    'HIGH',
    reason:   'Narcotraficante internacional. Cártel de Medellín.',
  },
  {
    keywords: ['BIN LADEN', 'OSAMA BIN LADEN', 'USAMA BIN LADIN'],
    entity:   'Osama Bin Laden',
    level:    'HIGH',
    reason:   'Terrorismo internacional. Lista OFAC / ONU.',
  },
  {
    keywords: ['KADHAFI', 'GADDAFI', 'MUAMMAR GADDAFI', 'MUAMMAR AL-GADDAFI'],
    entity:   'Muammar Gaddafi',
    level:    'HIGH',
    reason:   'Dirigente sancionado. Lista ONU / UE.',
  },
  {
    keywords: ['NICOLAS MADURO', 'MADURO MOROS', 'NICOLÁS MADURO'],
    entity:   'Nicolás Maduro Moros',
    level:    'HIGH',
    reason:   'Sanciones OFAC. Gobierno Venezuela.',
  },
  {
    keywords: ['AL-BAGHDADI', 'ABU BAKR AL-BAGHDADI', 'ABU BAKR ALBAGHDADI'],
    entity:   'Abu Bakr al-Baghdadi',
    level:    'HIGH',
    reason:   'Terrorismo. ISIS/DAESH. Lista ONU.',
  },
  {
    keywords: ['KIM JONG UN', 'KIM JONGUN', 'KIM JONG-UN'],
    entity:   'Kim Jong-un',
    level:    'HIGH',
    reason:   'Sanciones internacionales. RPDC.',
  },
  {
    keywords: ['VLADIMIR PUTIN', 'PUTIN VLADIMIR'],
    entity:   'Vladimir Putin',
    level:    'HIGH',
    reason:   'Sanciones UE / OFAC desde 2022.',
  },
  {
    keywords: ['TEST FRAUD', 'FRAUD TEST'],
    entity:   'Test Fraud Entity',
    level:    'MEDIUM',
    reason:   'Entidad de prueba para validación del sistema AML.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Normaliza un nombre para comparación: elimina tildes, dobles espacios,
// caracteres especiales y convierte a mayúsculas.
// ─────────────────────────────────────────────────────────────────────────────
function normalizarNombre(nombre) {
  return (nombre || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes/diacríticos
    .replace(/[^A-Z0-9 ]/g, ' ')     // quita guiones, puntos, etc.
    .replace(/\s+/g, ' ')            // colapsa espacios múltiples
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Comprueba el nombre contra la lista negra local.
// Devuelve el objeto de alerta o null si no hay coincidencia.
// ─────────────────────────────────────────────────────────────────────────────
function checkListaNegra(nombreNormalizado) {
  const match = LISTA_NEGRA.find(entry =>
    entry.keywords.some(kw => nombreNormalizado.includes(normalizarNombre(kw)))
  );

  if (match) {
    return {
      isAlert:       true,
      level:         match.level,
      message:       `ALERTA AML: El sujeto "${nombreNormalizado}" coincide con la entidad sancionada "${match.entity}". ${match.reason} Figura en listas de vigilancia de alto riesgo internacional.`,
      matchedEntity: match.entity,
      source:        'LOCAL_BLACKLIST',
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Construye el resultado limpio (sin alerta).
// ─────────────────────────────────────────────────────────────────────────────
function resultadoLimpio(sufijo = '') {
  return {
    isAlert:       false,
    level:         'NONE',
    message:       `LIMPIO: No se encontraron coincidencias en listas de sanciones internacionales.${sufijo}`,
    matchedEntity: null,
    source:        'OPENSANCTIONS',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// checkAML — función principal exportada
//
// Flujo:
//   1. Si no hay API key → modo simulación (lista local únicamente)
//   2. Si hay API key → consulta OpenSanctions API
//      a. Si score ≥ 0.5 → ALERTA de la API
//      b. Si 0 resultados o score bajo → comprueba lista local como fallback
//      c. Si error técnico → comprueba lista local como último recurso
//
// Siempre devuelve: { isAlert, level, message, matchedEntity, source }
// ─────────────────────────────────────────────────────────────────────────────
async function checkAML(nombreCompleto) {
  const apiKey         = process.env.OPENSANCTIONS_API_KEY;
  const nombreQuery    = (nombreCompleto || '').trim();
  const nombreNorm     = normalizarNombre(nombreQuery);

  if (!nombreQuery) {
    console.warn('[AML SERVICE] Nombre vacío recibido. Devolviendo resultado limpio.');
    return resultadoLimpio(' (Nombre no proporcionado)');
  }

  // ── MODO SIMULACIÓN (sin API key configurada) ──────────────────────────────
  if (!apiKey || apiKey === 'tu_key_aqui' || apiKey.trim() === '') {
    console.warn(`[AML SERVICE] ⚠️  Modo Simulación activo. Sin API key. Comprobando lista local para: ${nombreNorm}`);
    const matchLocal = checkListaNegra(nombreNorm);
    if (matchLocal) {
      console.warn(`[AML SERVICE] 🚨 ALERTA LOCAL: ${matchLocal.matchedEntity}`);
      return { ...matchLocal, source: 'LOCAL_BLACKLIST_SIM' };
    }
    return {
      ...resultadoLimpio(' (Simulado — sin API key)'),
      source: 'LOCAL_BLACKLIST_SIM',
    };
  }

  // ── CONSULTA REAL A OPENSANCTIONS ──────────────────────────────────────────
  try {
    // Sin filtro schema=Person → mayor cobertura de variantes y alias
    const url = `https://api.opensanctions.org/search/default?q=${encodeURIComponent(nombreQuery)}&limit=10`;

    console.log(`[AML SERVICE] Consultando OpenSanctions para: "${nombreQuery}"`);

    const response = await fetch(url, {
      method:  'GET',
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Accept':        'application/json',
      },
      signal: AbortSignal.timeout(8000), // timeout de 8s para no bloquear el flujo
    });

    // ── Plan trial agotado ────────────────────────────────────────────────────
    if (response.status === 402) {
      console.warn('[AML SERVICE] Límite trial alcanzado (402). Usando lista local como contingencia.');
      const matchLocal = checkListaNegra(nombreNorm);
      if (matchLocal) {
        return {
          ...matchLocal,
          message: matchLocal.message + ' (Verificado por lista local — trial API agotado)',
          source:  'LOCAL_BLACKLIST_FALLBACK',
        };
      }
      return {
        isAlert:       false,
        level:         'NONE',
        message:       'REVISIÓN MANUAL REQUERIDA: Límite del plan trial alcanzado. Verificar manualmente en OpenSanctions.',
        matchedEntity: null,
        source:        'MANUAL_REVIEW',
      };
    }

    // ── Respuesta no OK ───────────────────────────────────────────────────────
    if (!response.ok) {
      throw new Error(`OpenSanctions respondió con status HTTP ${response.status}`);
    }

    const data            = await response.json();
    const totalResultados = data.results?.length || 0;

    console.log(`[AML DEBUG] Resultados recibidos de OpenSanctions: ${totalResultados}`);

    if (totalResultados > 0) {
      const top = data.results[0];
      console.log('[AML DEBUG] Top match:', JSON.stringify({
        caption:  top.caption,
        score:    top.score,
        schema:   top.schema,
        datasets: top.datasets,
      }, null, 2));

      // Umbral 0.5 para capturar variantes de nombres compuestos en castellano
      const amenaza = data.results.find(r => r.score >= 0.5);

      if (amenaza) {
        const datasets = amenaza.datasets?.join(', ')              || 'listas internacionales';
        const topics   = amenaza.properties?.topics?.join(', ')    || 'entidad de alto riesgo';
        const paises   = amenaza.properties?.country?.join(', ')   || 'desconocido';

        const msg = [
          `ALERTA AML: Coincidencia con "${amenaza.caption}"`,
          `(Score: ${Math.round(amenaza.score * 100)}%).`,
          `Tipo de entidad: ${amenaza.schema}.`,
          `Clasificación de riesgo: ${topics}.`,
          `País asociado: ${paises}.`,
          `Fuente de datos: ${datasets}.`,
        ].join(' ');

        console.warn(`[AML SERVICE] 🚨 ALERTA API: ${amenaza.caption} — Score: ${amenaza.score}`);
        return {
          isAlert:       true,
          level:         'HIGH',
          message:       msg,
          matchedEntity: amenaza.caption,
          source:        'OPENSANCTIONS_API',
        };
      }
    }

    // ── Sin coincidencias suficientes → fallback lista local ─────────────────
    console.log('[AML SERVICE] Sin coincidencias en API (score < 0.5 o 0 resultados). Comprobando lista local...');
    const matchLocal = checkListaNegra(nombreNorm);
    if (matchLocal) {
      console.warn(`[AML SERVICE] 🚨 ALERTA LOCAL (fallback API): ${matchLocal.matchedEntity}`);
      return {
        ...matchLocal,
        message: matchLocal.message + ' (Detectado por lista de seguridad local — API sin resultado)',
        source:  'LOCAL_BLACKLIST_FALLBACK',
      };
    }

    console.log(`[AML SERVICE] ✅ LIMPIO: ${nombreNorm}`);
    return resultadoLimpio();

  } catch (error) {
    // ── Error técnico (timeout, red, JSON inválido, etc.) ────────────────────
    console.error('[AML SERVICE] Error en consulta real:', error.message);

    // La lista local actúa como última línea de defensa
    const matchLocal = checkListaNegra(nombreNorm);
    if (matchLocal) {
      console.warn(`[AML SERVICE] 🚨 Error técnico pero coincidencia local encontrada: ${matchLocal.matchedEntity}`);
      return {
        ...matchLocal,
        message: matchLocal.message + ' (Error técnico en API — detectado por lista local)',
        source:  'LOCAL_BLACKLIST_ERROR',
      };
    }

    // Si hay error y no hay coincidencia local, pedir revisión manual
    // (no aprobamos en caso de duda, por principio de precaución)
    return {
      isAlert:       false,
      level:         'NONE',
      message:       `REVISIÓN MANUAL REQUERIDA: No se pudo conectar con el servicio de sanciones internacionales. Error técnico: ${error.message}`,
      matchedEntity: null,
      source:        'ERROR_TECHNICAL',
    };
  }
}

module.exports = { checkAML };