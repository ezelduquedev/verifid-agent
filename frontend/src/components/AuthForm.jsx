import { useState } from 'react'
import { authService } from '../services/api'

const GdprBox = () => (
  <div style={{
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
    padding: '10px', marginBottom: '12px', fontSize: '11px', color: '#475569',
    lineHeight: 1.4, maxHeight: '100px', overflowY: 'auto', width: '100%'
  }}>
    <p style={{ margin: '0 0 5px', fontWeight: 700, color: '#1e40af', fontSize: '10px', textTransform: 'uppercase' }}>
      Consentimiento GDPR — Art. 7 RGPD
    </p>
    <ul style={{ margin: 0, paddingLeft: '15px', textAlign: 'left' }}>
      <li>Datos identificativos y contacto.</li>
      <li>Datos biométricos (DNI/NIE).</li>
      <li>Token de sesión JWT (localStorage).</li>
    </ul>
  </div>
)

const Field = ({ label, type = 'text', value, onChange, placeholder, icon, rightSlot }) => (
  <div style={{ marginBottom: '14px', width: '100%' }}>
    <label>{label}</label>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && <span style={{ position: 'absolute', left: '12px', color: '#64748b', display: 'flex', zIndex: 2 }}>{icon}</span>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required
        style={{ paddingLeft: icon ? '38px' : '12px', paddingRight: rightSlot ? '38px' : '12px', height: '42px' }}
      />
      {rightSlot && <span style={{ position: 'absolute', right: '12px', cursor: 'pointer', zIndex: 2, display: 'flex' }}>{rightSlot}</span>}
    </div>
  </div>
)

const AuthForm = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLogin && !consent) { setError('Debes aceptar el tratamiento de datos.'); return; }
    setError(''); setLoading(true)
    try {
      let response = isLogin 
        ? await authService.login(email, password) 
        : await authService.register(email, password, true)
      
      localStorage.setItem('verifid_token', response.data.token)
      localStorage.setItem('verifid_email', email)
      onAuthSuccess(response.data.user || { email })
    } catch (err) {
      setError(err.response?.data?.error || 'Error en la autenticación')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M6 16h12"/></svg>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>VerifID Agent</h2>
      </div>

      <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', marginBottom: '16px' }}>
        <button type="button" onClick={() => setIsLogin(false)} style={{ flex: 1, padding: '8px', background: !isLogin ? '#fff' : 'transparent', color: !isLogin ? '#2563eb' : '#64748b', fontSize: '12px', border: 'none' }}>Crear cuenta</button>
        <button type="button" onClick={() => setIsLogin(true)} style={{ flex: 1, padding: '8px', background: isLogin ? '#fff' : 'transparent', color: isLogin ? '#2563eb' : '#64748b', fontSize: '12px', border: 'none' }}>Iniciar sesión</button>
      </div>

      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>} />
        <Field label="Contraseña" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} rightSlot={<span onClick={() => setShowPwd(!showPwd)}>👁️</span>} />
      </div>

      {!isLogin && <GdprBox />}
      {!isLogin && (
        <label style={{ display: 'flex', gap: '8px', marginBottom: '16px', cursor: 'pointer', alignItems: 'center', justifyContent: 'flex-start' }}>
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: '14px', height: '14px' }} />
          <span style={{ fontSize: '11px', color: '#475569' }}>Acepto el tratamiento de datos.</span>
        </label>
      )}

      {error && <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

      <button onClick={handleSubmit} disabled={loading}>{loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Registrarse'}</button>

      <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#64748b' }}>
        {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
        <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>
          {isLogin ? 'Regístrate' : 'Entra'}
        </span>
      </p>
    </div>
  )
}

export default AuthForm