import { useState } from 'react'
import { verifyService } from '../services/api'

const statusConfig = {
  APPROVED: { icon: '✅', label: 'Verificación aprobada', cls: 'ap' },
  REJECTED: { icon: '❌', label: 'Verificación rechazada', cls: 'rj' },
  REVIEW:   { icon: '⏳', label: 'Revisión manual requerida', cls: 'rv' },
}

const ScoreBar = ({ label, value, color }) => (
  <div className="score-s">
    <div className="score-r">
      <span className="score-l">{label}</span>
      <span className="score-v" style={{ color }}>{value}%</span>
    </div>
    <div className="score-t">
      <div className="score-f" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
)

const AMLAlertBanner = ({ matchedEntity }) => (
  <div style={{ padding: '16px 18px', background: 'var(--danger-bg)', border: '1.5px solid var(--danger)', borderLeft: '6px solid var(--danger)', borderRadius: '10px', marginBottom: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <span style={{ fontSize: '22px' }}>🚨</span>
      <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '14px' }}>ALERTA AML — SUJETO SANCIONADO DETECTADO</span>
    </div>
    {matchedEntity && (
      <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600, marginBottom: '8px' }}>
        Entidad identificada: <em>{matchedEntity}</em>
      </div>
    )}
    <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d', lineHeight: 1.7 }}>
      Este sujeto ha sido identificado en listas de sanciones internacionales. La verificación ha sido <strong>bloqueada automáticamente</strong>. Este caso requiere notificación a las autoridades competentes.
    </p>
  </div>
)

const StepResultado = ({ result, onFinish }) => {
  const [downloading, setDownloading] = useState(false)
  const status = statusConfig[result.status] || statusConfig.REVIEW
  const trustColor = result.trustScore >= 80 ? '#15803d' : result.trustScore >= 50 ? 'var(--warn)' : 'var(--danger)'

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      await verifyService.downloadReport(result.id)
    } catch (err) {
      console.error('Error descargando PDF:', err)
      alert('No se pudo descargar el informe. Inténtalo de nuevo.')
    } finally { setDownloading(false) }
  }

  return (
    <div>
      {/* Section header */}
      <div className="sh">
        <div className="sh-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div>
          <div className="sh-title">Resultado de la Verificación</div>
          <div className="sh-sub">ID: {result.id?.slice(0, 8)}…</div>
        </div>
      </div>

      {/* AML alert */}
      {result.amlAlert && <AMLAlertBanner matchedEntity={result.matchedEntity} />}

      {/* Status banner */}
      <div className={`st-banner ${status.cls}`}>
        <div className="st-icon">{status.icon}</div>
        <div className={`st-label ${status.cls}`}>{status.label}</div>
        {result.amlAlert && (
          <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600, marginTop: '6px' }}>
            Motivo: coincidencia en listas de sanciones internacionales (AML)
          </div>
        )}
        {result.completedAt && (
          <div className="st-date">Completado: {new Date(result.completedAt).toLocaleString('es-ES')}</div>
        )}
      </div>

      {/* Scores */}
      <div className="card mb12">
        <div className="card-title">Puntuaciones</div>
        <ScoreBar label="Confianza global (Trust Score)" value={result.trustScore ?? 0} color={trustColor} />
        <ScoreBar label="Autenticidad documental" value={result.docScore ?? 0} color="var(--accent)" />
        <ScoreBar
          label="Riesgo de fraude"
          value={result.fraudScore ?? 0}
          color={result.fraudScore <= 20 ? '#15803d' : result.fraudScore <= 50 ? 'var(--warn)' : 'var(--danger)'}
        />
        <div className="ocr-row">
          <div className="ocr-dot" style={{ background: result.ocrMatch ? 'var(--success)' : 'var(--danger)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>
            OCR Match: <strong style={{ color: result.ocrMatch ? '#15803d' : 'var(--danger)' }}>
              {result.ocrMatch ? 'Datos coinciden con el documento' : 'No se pudo confirmar la coincidencia'}
            </strong>
          </span>
        </div>
      </div>

      {/* AML result */}
      {result.amlResult && (
        <div className="card mb12" style={{ borderLeft: result.amlAlert ? '4px solid var(--danger)' : undefined }}>
          <div className="card-title" style={{ color: result.amlAlert ? 'var(--danger)' : undefined }}>
            Verificación AML / Sanciones
          </div>
          {!result.amlAlert ? (
            <div className="aml-clean">
              <span>{result.amlResult}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--danger)', lineHeight: 1.6 }}>{result.amlResult}</p>
          )}
        </div>
      )}

      {/* AI report */}
      {result.aiReport && (
        <div className="card mb16">
          <div className="card-title">Informe Narrativo de IA</div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.7 }}>{result.aiReport}</p>
        </div>
      )}

      {/* Actions */}
      <button
        type="button" onClick={handleDownloadPDF} disabled={downloading}
        style={{ background: result.amlAlert ? 'var(--danger)' : 'var(--accent)', marginBottom: '10px' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        {downloading ? 'Generando informe...' : 'Descargar informe PDF'}
      </button>

      <button type="button" onClick={onFinish} className="btn-secondary">Finalizar sesión</button>
    </div>
  )
}

export default StepResultado
