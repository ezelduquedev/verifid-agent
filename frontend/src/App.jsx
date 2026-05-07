import { useState, useEffect } from 'react'
import './index.css'
import AuthForm from './components/AuthForm'
import StepDatos from './pages/StepDatos'
import UploadZone from './components/UploadZone'
import { verifyService } from './services/api'

function App() {
  const [user, setUser] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [verificationId, setVerificationId] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)
  const [finalResult, setFinalResult] = useState(null)
  const [pollingStatus, setPollingStatus] = useState('PROCESSING')

  useEffect(() => {
    const token = localStorage.getItem('verifid_token')
    const email = localStorage.getItem('verifid_email')
    if (token && email) {
      setUser({ email })
      setCurrentStep(1)
    }
    const handleExpire = () => { localStorage.clear(); setUser(null); setCurrentStep(0); }
    window.addEventListener('verifid:session-expired', handleExpire)
    return () => window.removeEventListener('verifid:session-expired', handleExpire)
  }, [])

  // Lógica de Polling (Mantenida 100%)
  useEffect(() => {
    let interval;
    if (currentStep === 3 && verificationId && !finalResult) {
      interval = setInterval(async () => {
        try {
          const { data } = await verifyService.getStatus(verificationId);
          setPollingStatus(data.status);
          if (['APPROVED', 'REJECTED', 'REVIEW'].includes(data.status)) {
            clearInterval(interval);
            const resultRes = await verifyService.getResult(verificationId);
            setFinalResult(resultRes.data);
          }
        } catch (err) { console.error("Polling error:", err); }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentStep, verificationId, finalResult]);

  const onAuthSuccess = (userData) => { setUser(userData); setCurrentStep(1); }
  const handleLogout = () => { localStorage.clear(); window.location.reload(); }

  const steps = ['Cuenta', 'Datos', 'Documento', 'Resultado']

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar centrada */}
      {currentStep > 0 && (
        <header style={{ width: '100%', background: 'var(--text-h)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px', position: 'sticky', top: 0, zIndex: 100 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff' }}>VerifID Agent</p>
          {user && <button onClick={handleLogout} style={{ width: 'auto', padding: '4px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.1)' }}>Salir</button>}
        </header>
      )}

      {/* Barra de progreso centrada */}
      {currentStep > 0 && (
        <div style={{ width: '100%', background: 'var(--code-bg)', borderBottom: '1px solid var(--border)', padding: '8px 1rem' }}>
          <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {steps.slice(1).map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: currentStep > i + 1 ? 'var(--success)' : currentStep === i + 1 ? 'var(--accent)' : 'var(--border)', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentStep > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '11px', color: currentStep === i+1 ? 'var(--text-h)' : 'var(--text)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <main style={{
        flex: 1, 
        width: '100%', 
        maxWidth: currentStep === 0 ? '420px' : '560px',
        margin: '0 auto', // Centra horizontalmente
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: currentStep === 0 ? 'center' : 'flex-start', // Centra verticalmente solo en login
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {currentStep === 0 && <AuthForm onAuthSuccess={onAuthSuccess} />}
        {currentStep === 1 && <StepDatos onStepComplete={(id) => { setVerificationId(id); setCurrentStep(2); }} />}
        {currentStep === 2 && (
          <div className="card">
             <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px', fontSize: '16px' }}>Paso 2: Documento</h2>
             <UploadZone verificationId={verificationId} onUploadSuccess={(data) => { setOcrResult(data); setCurrentStep(3); }} />
          </div>
        )}
        {currentStep === 3 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--success)', marginBottom: '10px' }}>✓ Verificación enviada</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Estado: {pollingStatus}</div>
            {finalResult && <div style={{ marginTop: '12px', textAlign: 'left', fontSize: '12px', background: 'var(--code-bg)', padding: '10px', borderRadius: '8px' }}>{finalResult.aiReport}</div>}
            <button className="btn-secondary" onClick={handleLogout}>Finalizar</button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App