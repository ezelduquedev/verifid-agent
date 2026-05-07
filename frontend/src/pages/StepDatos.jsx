import { useState } from 'react'
import { verifyService } from '../services/api'

// ── Field helper ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block',
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--text-h)',
      marginBottom: '6px',
      letterSpacing: '0.1px',
    }}>{label}</label>
    {children}
  </div>
)

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--bg)',
  color: 'var(--text-h)',
  fontFamily: 'inherit',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const Input = ({ name, type = 'text', placeholder, onChange, required, value }) => (
  <input
    name={name}
    type={type}
    placeholder={placeholder}
    onChange={onChange}
    required={required}
    value={value}
    style={inputStyle}
    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
  />
)

// ── Componente principal ─────────────────────────────────────────────────────
const StepDatos = ({ onStepComplete }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentNumber: '',
    birthDate: '',
    nationality: '',
    email: localStorage.getItem('verifid_email') || '',
    phone: '',
    country: 'España',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await verifyService.start(formData)
      onStepComplete(response.data.verificationId)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar la verificación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-h)' }}>
              Datos Personales
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>
              Introduce tus datos tal y como aparecen en tu documento oficial.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '12px' }}>

          {/* Nombre + Apellidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Nombre">
              <Input name="firstName" placeholder="María" onChange={handleChange} required />
            </Field>
            <Field label="Apellidos">
              <Input name="lastName" placeholder="García López" onChange={handleChange} required />
            </Field>
          </div>

          {/* Documento */}
          <Field label="Número de Documento (DNI / NIE / Pasaporte)">
            <Input name="documentNumber" placeholder="12345678X" onChange={handleChange} required />
          </Field>

          {/* Fecha + Nacionalidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Fecha de Nacimiento">
              <Input name="birthDate" type="date" onChange={handleChange} required />
            </Field>
            <Field label="Nacionalidad">
              <Input name="nationality" placeholder="Española" onChange={handleChange} required />
            </Field>
          </div>

          {/* Email (prellenado, readonly visual) */}
          <Field label="Correo electrónico">
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                ...inputStyle,
                background: 'var(--code-bg)',
                color: 'var(--text)',
                cursor: 'default',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>

          {/* Teléfono */}
          <Field label="Teléfono">
            <Input name="phone" type="tel" placeholder="+34 600 000 000" onChange={handleChange} required />
          </Field>

        </div>

        {/* Aviso */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          padding: '12px 14px',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--text)',
          lineHeight: 1.5,
        }}>
          <svg style={{ flexShrink: 0, marginTop: '1px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            Estos datos se usarán para contrastarlos con tu documento de identidad en el siguiente paso. Asegúrate de que coincidan exactamente.
          </span>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Continuar a Documentación →'}
        </button>
      </form>
    </div>
  )
}

export default StepDatos