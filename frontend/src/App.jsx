import { useState, useEffect } from 'react'
import './index.css'
import AuthForm from './components/AuthForm'
import StepDatos from './pages/StepDatos'
import UploadZone from './components/UploadZone'
import StepResultado from './pages/StepResultado'
import { verifyService } from './services/api'

// ── Dark mode ─────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('verifid_theme') === 'dark'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('verifid_theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, () => setDark(d => !d)]
}

// ── Navbar ────────────────────────────────────────────────
function Navbar({ user, onLogout, dark, onToggleDark }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'linear-gradient(135deg, var(--header-from) 0%, var(--header-to) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: '52px', gap: '8px',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '-.3px', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/>
          <path d="M15 8h2M15 12h2M6 16h12"/>
        </svg>
        VerifID Agent
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user && (
          <button
            onClick={onLogout}
            style={{ width: 'auto', padding: '5px 12px', fontSize: '11px', fontWeight: 600, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', boxShadow: 'none', color: '#fff' }}
          >
            Salir
          </button>
        )}
        <button
          onClick={onToggleDark}
          style={{ width: 'auto', padding: '6px 10px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '16px', lineHeight: 1, cursor: 'pointer', boxShadow: 'none' }}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}

// ── Progress bar — SOLO VISUAL, sin interacción ───────────
function ProgressStrip({ currentStep, finalResult }) {
  const steps = ['Datos', 'Documento', 'Análisis', 'Resultado']
  const active = finalResult ? 4 : currentStep // 1-based steps
  const statuses = steps.map((_, i) => {
    const idx = i + 1
    if (active > idx) return 'done'
    if (active === idx) return 'ac'
    return 'in'
  })

  return (
    <div style={{
      position: 'fixed', top: '52px', left: 0, right: 0, zIndex: 99,
      background: 'var(--surface-1)', borderBottom: '1px solid var(--border)',
      padding: '10px 16px',
      // El strip completo no responde a clics
      pointerEvents: 'none', userSelect: 'none',
    }}>
      <div className="progress" style={{ maxWidth: '500px', margin: '0 auto', marginBottom: 0 }}>
        {steps.map((label, i) => (
          <div
            key={label}
            className={`si ${statuses[i]}`}
            // Sin cursor ni interacción — es indicador visual puro
            style={{ cursor: 'default' }}
          >
            <div className="sc">{statuses[i] === 'done' ? '✓' : i + 1}</div>
            <span className="sl">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Analyzing screen ──────────────────────────────────────
function AnalyzingScreen({ pollingStatus }) {
  return (
    <div className="analyzing">
      <div className="spinner" />
      <div className="t-h mb8">Analizando documentación</div>
      <div className="t-sm">Este proceso puede tardar entre 20 y 40 segundos.</div>
      <div className="a-steps">
        <div className="a-step done">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Extracción OCR completada
        </div>
        <div className="a-step done">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Contraste de datos personales
        </div>
        <div className="a-step active">
          <div style={{ width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
          Consulta AML / OpenSanctions…
        </div>
        <div className="a-step pend">
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
          Generación de informe IA
        </div>
      </div>
      {pollingStatus && (
        <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'var(--code-bg)', borderRadius: '20px', fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>
          Estado: <span style={{ color: 'var(--accent)' }}>{pollingStatus}</span>
        </div>
      )}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [verificationId, setVerificationId] = useState(null)
  const [finalResult, setFinalResult] = useState(null)
  const [pollingStatus, setPollingStatus] = useState('PROCESSING')
  const [dark, toggleDark] = useDarkMode()

  useEffect(() => {
    const token = localStorage.getItem('verifid_token')
    const email = localStorage.getItem('verifid_email')
    if (token && email) { setUser({ email }); setCurrentStep(1) }
    const handleExpire = () => { localStorage.clear(); setUser(null); setCurrentStep(0) }
    window.addEventListener('verifid:session-expired', handleExpire)
    return () => window.removeEventListener('verifid:session-expired', handleExpire)
  }, [])

  useEffect(() => {
    let interval
    if (currentStep === 3 && verificationId && !finalResult) {
      interval = setInterval(async () => {
        try {
          const { data } = await verifyService.getStatus(verificationId)
          setPollingStatus(data.status)
          if (['APPROVED', 'REJECTED', 'REVIEW'].includes(data.status)) {
            clearInterval(interval)
            const resultRes = await verifyService.getResult(verificationId)
            setFinalResult({ ...resultRes.data, id: verificationId })
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [currentStep, verificationId, finalResult])

  const handleLogout = () => { localStorage.clear(); window.location.reload() }

  const showStrip = currentStep > 0
  const contentTop = showStrip ? '52px' : '0'       // navbar
  const contentPad = showStrip ? '52px' : '0'        // progress strip

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar user={user} onLogout={handleLogout} dark={dark} onToggleDark={toggleDark} />

      {showStrip && <ProgressStrip currentStep={currentStep} finalResult={finalResult} />}

      <div style={{ paddingTop: showStrip ? '104px' : '52px' }}>

        {/* Step 0: Login */}
        {currentStep === 0 && (
          <div className="login-bg" style={{ paddingTop: '68px', minHeight: 'calc(100vh - 52px)' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <AuthForm onAuthSuccess={(userData) => { setUser(userData); setCurrentStep(1) }} />
            </div>
          </div>
        )}

        {/* Step 1: Personal data */}
        {currentStep === 1 && (
          <div className="step-layout" style={{ minHeight: 'calc(100vh - 104px)' }}>
            <div className="step-con">
              <StepDatos onStepComplete={(id) => { setVerificationId(id); setCurrentStep(2) }} />
            </div>
          </div>
        )}

        {/* Step 2: Document upload */}
        {currentStep === 2 && (
          <div className="step-layout" style={{ minHeight: 'calc(100vh - 104px)' }}>
            <div className="step-con">
              <div className="card">
                <UploadZone verificationId={verificationId} onUploadSuccess={() => setCurrentStep(3)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Analyzing */}
        {currentStep === 3 && !finalResult && (
          <div style={{ minHeight: 'calc(100vh - 104px)' }}>
            <AnalyzingScreen pollingStatus={pollingStatus} />
          </div>
        )}

        {/* Step 4: Result */}
        {finalResult && (
          <div className="step-layout" style={{ minHeight: 'calc(100vh - 104px)' }}>
            <div className="step-con">
              <StepResultado result={finalResult} onFinish={handleLogout} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
