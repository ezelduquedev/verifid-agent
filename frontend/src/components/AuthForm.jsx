import { useState } from 'react'
import { authService } from '../services/api'

const LogoMark = () => (
  <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/>
      <path d="M15 8h2M15 12h2M6 16h12"/>
    </svg>
  </div>
)

const GdprBox = () => (
  <div className="gdpr">
    <div className="gdpr-t">Consentimiento GDPR — Art. 7 RGPD</div>
    <ul style={{ paddingLeft: '15px', textAlign: 'left' }}>
      <li>Datos identificativos y contacto.</li>
      <li>Datos biométricos (DNI, NIE, Pasaporte, Cédula).</li>
      <li>Token de sesión JWT (localStorage).</li>
    </ul>
  </div>
)

const Field = ({ label, type = 'text', value, onChange, placeholder, icon, rightSlot }) => (
  <div style={{ marginBottom: '14px', width: '100%' }}>
    <label>{label}</label>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{ position: 'absolute', left: '12px', color: '#64748b', display: 'flex', zIndex: 2, pointerEvents: 'none' }}>
          {icon}
        </span>
      )}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ paddingLeft: icon ? '38px' : '12px', paddingRight: rightSlot ? '38px' : '12px' }}
      />
      {rightSlot && (
        <span style={{ position: 'absolute', right: '12px', cursor: 'pointer', zIndex: 2, display: 'flex' }}>
          {rightSlot}
        </span>
      )}
    </div>
  </div>
)

// ── Forgot Password ───────────────────────────────────────
const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!email || !newPassword) { setError('Rellena los dos campos.'); return }
    if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true); setError('')
    try {
      await authService.resetPassword(email, newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo restablecer la contraseña.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="tc" style={{ padding: '20px 0' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
      <div className="t-h mb8">Contraseña actualizada</div>
      <p className="t-sm mb16">Ya puedes iniciar sesión con tu nueva contraseña.</p>
      <button onClick={onBack} style={{ width: 'auto', padding: '10px 24px' }}>Volver al inicio de sesión</button>
    </div>
  )

  return (
    <div style={{ width: '100%' }}>
      <div className="tc mb16">
        <LogoMark />
        <div className="t-h">Restablecer contraseña</div>
        <p className="t-s">Introduce tu email y una nueva contraseña.</p>
      </div>
      <div className="card-login mb12" style={{ padding: '16px' }}>
        <Field label="Email registrado" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
        />
        <Field label="Nueva contraseña" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        />
      </div>
      {error && <div className="error-msg">{error}</div>}
      <button onClick={handleReset} disabled={loading}>{loading ? 'Actualizando...' : 'Cambiar contraseña'}</button>
      <p className="tc mt12 t-sm">
        <span onClick={onBack} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>← Volver al inicio de sesión</span>
      </p>
    </div>
  )
}

// ── Auth tabs ─────────────────────────────────────────────
const AuthTabs = ({ isLogin, onSwitch }) => (
  <div style={{ display: 'flex', background: 'var(--code-bg)', padding: '3px', borderRadius: '10px', marginBottom: '16px' }}>
    {[{ label: 'Crear cuenta', val: false }, { label: 'Iniciar sesión', val: true }].map(({ label, val }) => (
      <button
        key={label} type="button" onClick={() => onSwitch(val)}
        style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
          background: isLogin === val ? 'var(--surface-1)' : 'transparent',
          color: isLogin === val ? 'var(--accent)' : 'var(--text)',
          fontSize: '12px', fontWeight: 600, width: 'auto',
          boxShadow: isLogin === val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          transform: 'none',
        }}
      >
        {label}
      </button>
    ))}
  </div>
)

// ── Main AuthForm ─────────────────────────────────────────
const AuthForm = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isForgot) return <ForgotPassword onBack={() => { setIsForgot(false); setIsLogin(true) }} />

  const handleSubmit = async () => {
    if (!isLogin && !consent) { setError('Debes aceptar el tratamiento de datos.'); return }
    setError(''); setLoading(true)
    try {
      const response = isLogin
        ? await authService.login(email, password)
        : await authService.register(email, password, true)
      localStorage.setItem('verifid_token', response.data.token)
      localStorage.setItem('verifid_email', email)
      onAuthSuccess(response.data.user || { email })
    } catch (err) {
      setError(err.response?.data?.error || 'Error en la autenticación')
    } finally { setLoading(false) }
  }

  const eyeIcon = (
    <span onClick={() => setShowPwd(!showPwd)} style={{ fontSize: '14px', userSelect: 'none' }}>
      {showPwd ? '🙈' : '👁️'}
    </span>
  )

  return (
    <div style={{ width: '100%' }}>
      <div className="tc mb12">
        <LogoMark />
        <div className="t-h">VerifID Agent</div>
      </div>

      <AuthTabs isLogin={isLogin} onSwitch={setIsLogin} />

      <div className="card-login mb12">
        <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
        />
        <Field label="Contraseña" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
          rightSlot={eyeIcon}
        />
        {isLogin && (
          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <span onClick={() => setIsForgot(true)} style={{ fontSize: '11px', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        )}
      </div>

      {!isLogin && <GdprBox />}
      {!isLogin && (
        <label style={{ display: 'flex', gap: '8px', marginBottom: '16px', cursor: 'pointer', alignItems: 'center' }}>
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text)' }}>Acepto el tratamiento de datos.</span>
        </label>
      )}

      {error && <div className="error-msg">{error}</div>}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Registrarse'}
      </button>

      <p className="tc mt12 t-sm">
        {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
        <span onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
          {isLogin ? 'Regístrate' : 'Entra'}
        </span>
      </p>
    </div>
  )
}

export default AuthForm
