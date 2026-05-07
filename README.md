# 🛡️ VerifID Agent

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/Claude-Anthropic-D97757?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/GDPR-Compliant-0072CE?style=for-the-badge"/>
</p>

<p align="center">
  Sistema <strong>KYC (Know Your Customer)</strong> con Inteligencia Artificial orientado a validación documental, análisis de riesgo y generación automatizada de informes.<br/>
  Simula la arquitectura utilizada por <strong>fintechs y plataformas RegTech</strong> para procesos de verificación de identidad.
</p>

---

## 📌 Estado Actual — 7 de mayo de 2026

> El backend se encuentra **arquitectónicamente completo** y funcional en entorno de pruebas.  
> El frontend React está en **integración activa**.

El sistema permite ejecutar el flujo KYC completo desde entorno técnico (Postman):

- ✅ Registro y autenticación con JWT
- ✅ Captura de datos personales
- ✅ Subida de documentación
- ✅ OCR con Tesseract
- ✅ Fuzzy matching de identidad
- ✅ Análisis AML / PEP
- ✅ Informe narrativo generado con IA
- ✅ Emisión de PDF dinámico

> ⚠️ Los módulos de OCR, fuzzy matching e integración AML/IA están en **fase de calibración** para mejorar la precisión antes del despliegue en producción.

---

## 🧱 Fases del Proyecto

| Fase | Estado |
|------|--------|
| Infraestructura (Monorepo + Prisma + Supabase) | ✅ Completado |
| Autenticación (JWT + bcrypt + GDPR) | ✅ Completado |
| Gestión Documental (OCR + Multer + Hash) | 🟡 Implementado — En calibración |
| IA y Scoring de Riesgo | 🟡 Implementado — En validación |
| Frontend React (UX multi-step) | 🟡 En curso |
| Despliegue (Railway + Vercel) | ⏳ Pendiente |

---

## 🔎 Flujo KYC

```
Usuario → Registro/Login → Datos personales → Subida de documento
                                                       ↓
                                               OCR (Tesseract)
                                                       ↓
                                            Fuzzy Matching (fuzzball)
                                                       ↓
                                            AML / PEP Check (OpenSanctions)
                                                       ↓
                                            Análisis IA (Claude API)
                                                       ↓
                                               Scoring final
                                                       ↓
                                            Generación PDF (PDFKit)
                                                       ↓
                                     APPROVED / REVIEW / REJECTED
```

---

## 📂 Estructura del Proyecto

```
verifid-agent/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma               # Esquema BD: users, verifications, documents, risk_assessments
│   │
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js       # Registro/Login con bcrypt + JWT
│   │   │   ├── verifyController.js     # Pipeline KYC completo
│   │   │   ├── userController.js       # Gestión de perfil
│   │   │   └── adminController.js      # Panel de administración
│   │   │
│   │   ├── lib/
│   │   │   └── prisma.js               # Cliente Prisma singleton
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # Verificación JWT
│   │   │   └── rateLimiter.js          # Rate limiting global
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js                 # POST /api/auth/register, /login
│   │   │   ├── verify.js               # POST /api/verify/start, /document, /result
│   │   │   ├── user.js                 # GET  /api/user/profile
│   │   │   └── admin.js                # GET  /api/admin/verifications
│   │   │
│   │   ├── services/
│   │   │   ├── claudeService.js        # Proxy seguro → Anthropic Claude
│   │   │   ├── ocrService.js           # Extracción de texto con Tesseract.js
│   │   │   ├── amlService.js           # Consulta AML/PEP a OpenSanctions
│   │   │   └── pdfService.js           # Generación de informes PDF con PDFKit
│   │   │
│   │   └── index.js                    # Servidor Express (puerto 3000)
│   │
│   ├── uploads/
│   ├── temp/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthForm.jsx            # Registro/Login con consentimiento GDPR
│   │   │   └── UploadZone.jsx          # Drag & drop de documentos
│   │   │
│   │   ├── hooks/                      # (en desarrollo)
│   │   │
│   │   ├── pages/
│   │   │   └── StepDatos.jsx           # Formulario de datos personales (Step 1)
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # Axios con interceptores JWT
│   │   │
│   │   ├── App.jsx                     # Router de pasos + polling
│   │   ├── index.css                   # Sistema de diseño global
│   │   └── main.jsx
│   │
│   ├── vite.config.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 18+ |
| Framework API | Express |
| ORM | Prisma + PostgreSQL |
| Base de datos cloud | Supabase |
| Autenticación | JWT + bcryptjs |
| OCR | Tesseract.js |
| Fuzzy Matching | fuzzball |
| IA generativa | Anthropic Claude API |
| AML/PEP | OpenSanctions API |
| PDF | PDFKit |
| Frontend | React + Vite |
| HTTP Client | Axios |

---

## 🔧 Instalación

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# → http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🌱 Variables de Entorno

### `backend/.env`

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/verifid
JWT_SECRET=tu_secreto_seguro_minimo_32_caracteres
ANTHROPIC_API_KEY=sk-ant-...
OPENSANCTIONS_API_KEY=          # Dejar vacío activa el modo simulación
PORT=3000
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

---

## 🔐 Seguridad Implementada

- Autenticación JWT con expiración configurable
- Hashing de contraseñas con bcrypt (cost 12)
- Consentimiento GDPR obligatorio con timestamp de auditoría
- Rate limiting global contra abuso de API
- Procesamiento documental en memoria (sin escritura en disco)
- Hash SHA-256 de cada documento procesado
- Proxy seguro para APIs externas (la clave de Anthropic nunca sale al cliente)
- Fallbacks ante errores de red (prioridad seguridad > disponibilidad)

---

## 📊 Estado Técnico Detallado

### Backend
- ✅ Arquitectura en capas estable
- ✅ Endpoints principales operativos
- ✅ Pipeline KYC implementado de extremo a extremo
- ✅ Generación PDF funcional
- 🟡 OCR en calibración con documentos de prueba
- 🟡 Umbral de fuzzy matching en ajuste
- 🟡 Validación AML real pendiente de API Key
- 🟡 Refinamiento de prompts IA en progreso

### Frontend
- ✅ Autenticación (AuthForm)
- ✅ Captura de datos personales (StepDatos)
- ✅ Subida documental (UploadZone)
- ✅ Polling automático de verificación (App.jsx)
- ⏳ StepAnalisis.jsx
- ⏳ StepResultado.jsx
- ⏳ RiskScoreGrid
- ⏳ Hook useVerification

---

## 🚧 Próximos Pasos

- [ ] Ajustar umbral de fuzzy matching
- [ ] Mejorar preprocesamiento de imagen para OCR
- [ ] Validar coincidencias AML con API Key real
- [ ] Refinar prompts de análisis narrativo con Claude
- [ ] Finalizar pantallas de resultados (StepAnalisis, StepResultado)
- [ ] Ejecutar plan de pruebas TC-01 a TC-08
- [ ] Despliegue: Railway (backend) + Vercel (frontend)

---

## 🎯 Objetivo del Proyecto

Construir una arquitectura KYC moderna y modular que pueda evolucionar hacia biometría facial, detección antifraude avanzada, panel administrativo, workflows empresariales y trazabilidad regulatoria completa.

La complejidad principal reside en la **coordinación de múltiples servicios asíncronos** dentro de un pipeline coherente de verificación, replicando los estándares de una plataforma RegTech real.

---

## 👨‍💻 Autor

**Ezel Alexander Duque Arias**  
Proyecto de prácticas enfocado en arquitectura fullstack aplicada a KYC, IA y análisis de riesgo.

---

<p align="center"><em>VerifID Agent · 2026</em></p>
