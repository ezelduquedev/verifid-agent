import { useState, useEffect } from 'react'
import './index.css'
import AuthForm from './components/AuthForm'
import StepDatos from './pages/StepDatos'
import UploadZone from './components/UploadZone'
import StepResultado from './pages/StepResultado'
import { verifyService } from './services/api'

function App() {
  const [user, setUser] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [verificationId, setVerificationId] = useState(null)
  const [finalResult, setFinalResult] = useState(null)
  const [pollingStatus, setPollingStatus] = useState('PROCESSING')

  useEffect(() => {
    const token = localStorage.getItem('verifid_token')
    const email = localStorage.getItem('verifid_email')
    if (token && email) {
      setUser({ email })
      setCurrentStep(1)
    }
    const handleExpire = () => { localStorage.clear(); setUser(null); setCurrentStep(0) }
    window.addEventListener('verifid:session-expired', handleExpire)
    return () => window.removeEventListener('verifid:session-expired', handleExpire)
  }, [])

  // Polling — solo activo en el paso 3 (análisis) hasta que tengamos resultado final
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
            // BUG 3 FIX: guardamos el id para que StepResultado pueda descargar el PDF
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
  const steps = ['Cuenta', 'Datos', 'Documento', 'Analizando', 'Resultado']

  // Paso visible en la barra de progreso (pasos 1-4 mapeados a índices 0-3)
  const progressStep = finalResult ? 4 : currentStep

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Topbar */}
      {currentStep > 0 && (
        <header style={{ width: '100%', background: 'var(--text-h)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px', position: 'sticky', top: 0, zIndex: 100 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff' }}>VerifID Agent</p>
          {user && <button onClick={handleLogout} style={{ width: 'auto', padding: '4px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.1)' }}>Salir</button>}
        </header>
      )}

      {/* Barra de progreso */}
      {currentStep > 0 && (
        <div style={{ width: '100%', background: '#f4f3ec', borderBottom: '1px solid var(--border)', padding: '8px 1rem' }}>
          <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {steps.slice(1).map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: progressStep > i + 1 ? 'var(--success)' : progressStep === i + 1 ? 'var(--accent)' : 'var(--border)', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {progressStep > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '11px', color: progressStep === i + 1 ? 'var(--text-h)' : 'var(--text)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <main style={{ flex: 1, width: '100%', maxWidth: currentStep === 0 ? '420px' : '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: currentStep === 0 ? 'center' : 'flex-start', padding: '20px', boxSizing: 'border-box' }}>

        {/* Paso 0: Login/Registro */}
        {currentStep === 0 && (
          <AuthForm onAuthSuccess={(userData) => { setUser(userData); setCurrentStep(1) }} />
        )}

        {/* Paso 1: Datos personales */}
        {currentStep === 1 && (
          <StepDatos onStepComplete={(id) => { setVerificationId(id); setCurrentStep(2) }} />
        )}

        {/* Paso 2: Subida de documento */}
        {currentStep === 2 && (
          <div className="card">
            <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px', fontSize: '16px' }}>Paso 2: Documento</h2>
            <UploadZone
              verificationId={verificationId}
              onUploadSuccess={() => setCurrentStep(3)}
            />
          </div>
        )}

        {/* Paso 3: Análisis en curso (polling) — BUG 3 FIX: pantalla de espera real */}
        {currentStep === 3 && !finalResult && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 20px' }}/>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text-h)' }}>Analizando tu documentación</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
              El sistema está ejecutando el OCR, cruzando los datos y generando el informe IA.<br/>
              Esto puede tardar entre 15 y 30 segundos.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#f4f3ec', borderRadius: '20px', fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>
              Estado: <span style={{ color: 'var(--accent)' }}>{pollingStatus}</span>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Paso 4: Resultado final — BUG 3 FIX: componente StepResultado con scores + PDF */}
        {finalResult && (
          <StepResultado result={finalResult} onFinish={handleLogout} />
        )}

      </main>
    </div>
  )
}

export default App