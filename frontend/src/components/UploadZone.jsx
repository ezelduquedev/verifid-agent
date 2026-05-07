import { useState } from 'react'
import { verifyService } from '../services/api'

const DOC_TYPES = ['DNI', 'NIE', 'Pasaporte']

const UploadZone = ({ verificationId, onUploadSuccess }) => {
  const [files, setFiles] = useState({ front: null, back: null })
  const [previews, setPreviews] = useState({ front: null, back: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [docType, setDocType] = useState('DNI')
  const [side, setSide] = useState('front')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setFiles(prev => ({ ...prev, [side]: selectedFile }))
      setPreviews(prev => ({ ...prev, [side]: url }))
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
      setError('')
    }
  }

  const handleUpload = async (e) => {
    // Prevenimos el comportamiento por defecto si se usa dentro de un form
    if (e) e.preventDefault();
    
    const currentFile = files[side]
    if (!currentFile) return setError(`Selecciona la imagen del ${side === 'front' ? 'Anverso' : 'Reverso'} primero`)
    
    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('document', currentFile) // Este nombre debe coincidir con upload.single('document') en el backend
    formData.append('side', side)
    formData.append('docType', docType)
    
    try {
      const response = await verifyService.uploadDoc(verificationId, formData)
      if (onUploadSuccess) onUploadSuccess(response.data)
    } catch (err) {
      console.error("Upload error:", err)
      setError(err.response?.data?.error || 'Error al procesar el documento. Revisa la consola del backend.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    if (previews[side]) URL.revokeObjectURL(previews[side]) // Limpieza de memoria
    setPreviews(prev => ({ ...prev, [side]: null }))
    setFiles(prev => ({ ...prev, [side]: null }))
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

  const currentPreview = previews[side]

  return (
    <div className="upload-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <circle cx="9" cy="10" r="2"/>
            <path d="M15 8h2M15 12h2M6 16h12"/>
          </svg>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-h)' }}>
            Verificación de Identidad
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>
            Sube las fotos de tu {docType} para continuar.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="docType-select" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text)', opacity: 0.6, marginBottom: '5px', textTransform: 'uppercase' }}>
              Tipo de documento
            </label>
            <select id="docType-select" value={docType} onChange={e => setDocType(e.target.value)} style={selectStyle}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text)', opacity: 0.6, marginBottom: '5px', textTransform: 'uppercase' }}>
              Cara a subir
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['front', 'Anverso'], ['back', 'Reverso']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSide(val)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    border: `1px solid ${side === val ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    background: side === val ? 'var(--accent-bg)' : 'var(--bg)',
                    color: side === val ? 'var(--accent)' : 'var(--text)',
                    fontSize: '13px',
                    fontWeight: side === val ? 700 : 400,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {label}
                  {files[val] && (
                    <span title="Archivo cargado" style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', border: '2px solid white' }}></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drop zone con label integrada para accesibilidad */}
        <label 
          htmlFor="file-input"
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'block',
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '10px',
            padding: currentPreview ? '16px' : '40px 20px',
            background: dragging ? 'var(--accent-bg)' : 'var(--code-bg)',
            position: 'relative',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s'
          }}
        >
          {!currentPreview ? (
            <>
              <div style={{ width: '48px', height: '48px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.8">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>
                Sube el {side === 'front' ? 'Anverso' : 'Reverso'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>Click para buscar archivo</p>
            </>
          ) : (
            <div>
              <img
                src={currentPreview}
                alt="Vista previa"
                style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', display: 'block', margin: '0 auto' }}
              />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '4px 12px', background: 'var(--accent-bg)', borderRadius: '20px', fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                ✓ {side.toUpperCase()} CARGADO
              </div>
            </div>
          )}

          <input
            id="file-input"
            name="document"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
          />
        </label>

        {currentPreview && !loading && (
          <button type="button" onClick={reset} className="btn-secondary" style={{ marginTop: '10px', width: '100%', fontSize: '12px' }}>
            Quitar foto del {side === 'front' ? 'anverso' : 'reverso'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: '#ef4444', background: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fee2e2' }}>
           ⚠️ {error}
        </div>
      )}

      <button 
        className="btn-primary"
        onClick={handleUpload} 
        disabled={!files[side] || loading}
        style={{ 
            width: '100%', 
            padding: '14px',
            background: loading ? '#94a3b8' : 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
        }}
      >
        {loading && <div className="spinner"></div>}
        {loading ? 'Procesando OCR...' : `Verificar ${side === 'front' ? 'Anverso' : 'Reverso'}`}
      </button>

      <style>{`
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default UploadZone