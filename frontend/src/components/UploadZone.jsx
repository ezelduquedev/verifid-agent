import { useState } from 'react'
import { verifyService } from '../services/api'

const DOC_TYPES = ['DNI', 'NIE', 'Pasaporte', 'Cédula']

// Tipos de documento que solo requieren el anverso
const SINGLE_SIDE_TYPES = ['Pasaporte', 'Cédula']

const UploadZone = ({ verificationId, onUploadSuccess }) => {
  const [files, setFiles] = useState({ front: null, back: null })
  const [previews, setPreviews] = useState({ front: null, back: null })
  const [uploaded, setUploaded] = useState({ front: false, back: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [docType, setDocType] = useState('DNI')
  const [side, setSide] = useState('front')

  const isSingleSide = SINGLE_SIDE_TYPES.includes(docType)
  const bothSidesUploaded = isSingleSide ? uploaded.front : (uploaded.front && uploaded.back)
  const currentFile = files[side]
  const currentPreview = previews[side]
  const currentUploaded = uploaded[side]

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setFiles(prev => ({ ...prev, [side]: selectedFile }))
      setPreviews(prev => ({ ...prev, [side]: url }))
      setUploaded(prev => ({ ...prev, [side]: false }))
      setError('')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const url = URL.createObjectURL(droppedFile)
      setFiles(prev => ({ ...prev, [side]: droppedFile }))
      setPreviews(prev => ({ ...prev, [side]: url }))
      setUploaded(prev => ({ ...prev, [side]: false }))
      setError('')
    }
  }

  // BUG 1 FIX: era verifyService.uploadDoc() — función que NO existe en api.js
  // BUG 2 FIX: cada lado se sube por separado; solo avanzamos cuando ambos están confirmados
  const handleUpload = async (e) => {
    if (e) e.preventDefault()
    if (!currentFile) return setError(`Selecciona la imagen del ${side === 'front' ? 'Anverso' : 'Reverso'} primero`)
    if (currentUploaded) return setError('Este lado ya fue subido. Selecciona el otro lado.')

    setLoading(true)
    setError('')

    try {
      const response = await verifyService.uploadDocument(verificationId, files[side], side, docType)

      const newUploaded = { ...uploaded, [side]: true }
      setUploaded(newUploaded)

      const allDone = isSingleSide ? newUploaded.front : (newUploaded.front && newUploaded.back)

      if (allDone) {
        // Todos los lados subidos → avanzar al paso 3
        onUploadSuccess(response.data)
      } else {
        // Cambiar automáticamente al lado pendiente
        setSide(side === 'front' ? 'back' : 'front')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.response?.data?.error || 'Error al procesar el documento. Revisa la consola del backend.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    if (previews[side]) URL.revokeObjectURL(previews[side])
    setPreviews(prev => ({ ...prev, [side]: null }))
    setFiles(prev => ({ ...prev, [side]: null }))
    setUploaded(prev => ({ ...prev, [side]: false }))
    setError('')
  }

  const selectStyle = {
    padding: '9px 12px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    flex: 1,
  }

  const sidesNeeded = isSingleSide ? ['front'] : ['front', 'back']
  const sidesLabels = { front: 'Anverso', back: 'Reverso' }

  return (
    <div className="upload-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{ width: '36px', height: '36px', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <circle cx="9" cy="10" r="2"/>
            <path d="M15 8h2M15 12h2M6 16h12"/>
          </svg>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-h)' }}>Verificación de Identidad</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>Sube las fotos de tu {docType} para continuar.</p>
        </div>
      </div>

      {/* Indicador de progreso por lados */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {sidesNeeded.map(s => (
          <div key={s} onClick={() => !uploaded[s] && setSide(s)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${uploaded[s] ? 'var(--success)' : side === s ? 'var(--accent)' : 'var(--border)'}`, background: uploaded[s] ? 'rgba(34,197,94,0.08)' : side === s ? 'rgba(29,78,216,0.06)' : 'var(--code-bg)', display: 'flex', alignItems: 'center', gap: '6px', cursor: uploaded[s] ? 'default' : 'pointer' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, background: uploaded[s] ? 'var(--success)' : side === s ? 'var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploaded[s]
                ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <span style={{ fontSize: '9px', color: 'white', fontWeight: 700 }}>{s === 'front' ? '1' : '2'}</span>
              }
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: uploaded[s] ? '#15803d' : side === s ? 'var(--accent)' : 'var(--text)' }}>
              {sidesLabels[s]}{uploaded[s] ? ' ✓' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="docType-select" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', opacity: 0.6, marginBottom: '5px', textTransform: 'uppercase' }}>Tipo de documento</label>
            <select id="docType-select" value={docType} onChange={e => { setDocType(e.target.value); setUploaded({ front: false, back: false }); setSide('front') }} style={selectStyle}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {!isSingleSide && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', opacity: 0.6, marginBottom: '5px', textTransform: 'uppercase' }}>Cara a subir</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[['front', 'Anverso'], ['back', 'Reverso']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setSide(val)} disabled={uploaded[val]} style={{ flex: 1, padding: '9px', border: `1px solid ${uploaded[val] ? 'var(--success)' : side === val ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', background: uploaded[val] ? 'rgba(34,197,94,0.08)' : side === val ? 'rgba(29,78,216,0.08)' : 'var(--bg)', color: uploaded[val] ? '#15803d' : side === val ? 'var(--accent)' : 'var(--text)', fontSize: '13px', fontWeight: side === val ? 700 : 400, cursor: uploaded[val] ? 'default' : 'pointer', width: 'auto' }}>
                    {label}{uploaded[val] ? ' ✓' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!currentUploaded ? (
          <label htmlFor="file-input" onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} style={{ display: 'block', border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', padding: currentPreview ? '16px' : '40px 20px', background: dragging ? 'rgba(29,78,216,0.06)' : 'var(--code-bg)', position: 'relative', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
            {!currentPreview ? (
              <>
                <div style={{ width: '48px', height: '48px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>Sube el {side === 'front' ? 'Anverso' : 'Reverso'}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>Click para buscar · JPG, PNG</p>
              </>
            ) : (
              <div>
                <img src={currentPreview} alt="Vista previa" style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', display: 'block', margin: '0 auto' }}/>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '4px 12px', background: 'rgba(29,78,216,0.08)', borderRadius: '20px', fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                  {side.toUpperCase()} LISTO PARA SUBIR
                </div>
              </div>
            )}
            <input id="file-input" name="document" type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}/>
          </label>
        ) : (
          <div style={{ padding: '20px', background: 'rgba(34,197,94,0.06)', border: '1px solid var(--success)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>✅</div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#15803d' }}>{sidesLabels[side]} subido correctamente</p>
            {!bothSidesUploaded && <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text)' }}>Ahora sube el {side === 'front' ? 'Reverso' : 'Anverso'} para continuar</p>}
          </div>
        )}

        {currentPreview && !currentUploaded && !loading && (
          <button type="button" onClick={reset} className="btn-secondary" style={{ marginTop: '10px', width: '100%', fontSize: '12px' }}>
            Quitar foto del {side === 'front' ? 'anverso' : 'reverso'}
          </button>
        )}
      </div>

      {error && <div style={{ color: '#ef4444', background: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fee2e2' }}>⚠️ {error}</div>}

      {!currentUploaded && (
        <button type="button" onClick={handleUpload} disabled={!currentFile || loading} style={{ width: '100%', padding: '14px', background: loading ? '#94a3b8' : 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          {loading && <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>}
          {loading ? 'Procesando OCR...' : `Subir ${side === 'front' ? 'Anverso' : 'Reverso'}`}
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default UploadZone