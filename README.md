# 🛡️ VerifID Agent

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq-IA-F55036?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/GDPR-Compliant-0072CE?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Railway-Deploy-0B0D0E?style=for-the-badge&logo=railway&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
</p>

<p align="center">
  Sistema <strong>KYC (Know Your Customer)</strong> con Inteligencia Artificial orientado a validación documental, análisis de riesgo y generación automatizada de informes.<br/>
  Simula la arquitectura utilizada por <strong>fintechs y plataformas RegTech</strong> para procesos de verificación de identidad.
</p>

<p align="center">
  <a href="https://verifid-agent.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐 Demo en producción-verifid--agent.vercel.app-2563eb?style=for-the-badge"/>
  </a>
</p>

---

## 📌 Estado Actual — Mayo 2026

> El sistema se encuentra **completamente desplegado en producción** y operativo de extremo a extremo.

- ✅ Registro y autenticación con JWT
- ✅ Recuperación de contraseña
- ✅ Captura de datos personales (email bloqueado tras registro)
- ✅ Subida de documentación (DNI, NIE, Pasaporte, Cédula)
- ✅ OCR con Tesseract.js
- ✅ Fuzzy matching de identidad
- ✅ Análisis AML / PEP (OpenSanctions + lista local)
- ✅ Informe narrativo generado con IA (Groq)
- ✅ Emisión de PDF dinámico (una sola página)
- ✅ Alerta visual AML con bloqueo automático
- ✅ Despliegue Railway (backend) + Vercel (frontend)

---

## 🧱 Fases del Proyecto

| Fase | Estado |
|------|--------|
| Infraestructura (Monorepo + Prisma + Supabase) | ✅ Completado |
| Autenticación (JWT + bcrypt + GDPR) | ✅ Completado |
| Gestión Documental (OCR + Multer + Hash) | ✅ Completado |
| IA y Scoring de Riesgo | ✅ Completado |
| Frontend React (UX multi-step) | ✅ Completado |
| AML / PEP con alerta visual | ✅ Completado |
| Despliegue (Railway + Vercel) | ✅ Completado |

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
                                            Análisis IA (Groq)
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
│   │   │   ├── authController.js       # Registro / Login / Reset password
│   │   │   ├── verifyController.js     # Pipeline KYC completo
│   │   │   ├── userController.js       # Gestión de perfil
│   │   │   └── adminController.js      # Panel de administración
│   │   │
│   │   ├── lib/
│   │   │   └── prisma.js               # Cliente Prisma singleton
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # Verificación JWT (expired / invalid / not-active)
│   │   │   └── rateLimiter.js          # Rate limiting global
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js                 # /api/auth — register, login, reset-password
│   │   │   ├── verify.js               # /api/verify — start, document, status, result, report
│   │   │   ├── user.js                 # /api/user — profile
│   │   │   └── admin.js                # /api/admin — verifications
│   │   │
│   │   ├── services/
│   │   │   ├── groqService.js          # Informe narrativo con Groq IA
│   │   │   ├── ocrService.js           # Extracción de texto con Tesseract.js
│   │   │   ├── amlService.js           # Consulta AML/PEP a OpenSanctions + lista local
│   │   │   └── pdfService.js           # Generación de informes PDF con PDFKit
│   │   │
│   │   └── index.js                    # Servidor Express
│   │
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
│   │   │   ├── AuthForm.jsx            # Registro / Login / Recuperar contraseña
│   │   │   └── UploadZone.jsx          # Drag & drop de documentos
│   │   │
│   │   ├── pages/
│   │   │   ├── StepDatos.jsx           # Formulario de datos personales
│   │   │   └── StepResultado.jsx       # Resultado con scores, alerta AML y PDF
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # Axios con interceptores JWT
│   │   │
│   │   ├── App.jsx                     # Router de pasos + polling de estado
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

## 🌐 API — Endpoints

### 🔓 Públicos (sin autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Estado del servidor |
| `POST` | `/api/auth/register` | Crear cuenta nueva |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/reset-password` | Restablecer contraseña |

### 🔒 Privados (requieren `Authorization: Bearer <token>`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/verify/start` | Iniciar verificación KYC |
| `POST` | `/api/verify/:id/document` | Subir cara del documento |
| `GET` | `/api/verify/:id/status` | Consultar estado del análisis |
| `GET` | `/api/verify/:id/result` | Obtener resultado completo + scores |
| `GET` | `/api/verify/:id/report` | Descargar informe PDF |
| `GET` | `/api/user/profile` | Perfil del usuario |
| `GET` | `/api/admin/verifications` | Panel de administración (rol ADMIN) |

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 18+ |
| Framework API | Express 5 |
| ORM | Prisma + PostgreSQL |
| Base de datos cloud | Supabase |
| Autenticación | JWT + bcryptjs |
| OCR | Tesseract.js |
| Fuzzy Matching | fuzzball |
| IA generativa | Groq API |
| AML/PEP | OpenSanctions API |
| PDF | PDFKit |
| Frontend | React 19 + Vite |
| HTTP Client | Axios |
| Backend deploy | Railway |
| Frontend deploy | Vercel |

---

## 🔧 Instalación local

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# → http://localhost:3001
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
DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
JWT_SECRET=tu_secreto_seguro_minimo_32_caracteres
GROQ_API_KEY=gsk_...
OPENSANCTIONS_API_KEY=          # Dejar vacío activa el modo simulación
NODE_ENV=production
FRONTEND_URL=https://tu-app.vercel.app
PORT=3001
```

### `frontend/.env`

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
```

---

## 🚀 Despliegue en Producción

### Backend → Railway

1. Conecta el repositorio y selecciona `backend/` como directorio raíz.
2. Añade todas las variables de entorno del `backend/.env` en el panel de Railway.
3. Railway ejecuta automáticamente `npm install` (que incluye `prisma generate` vía `postinstall`).
4. Ejecuta las migraciones desde local apuntando a producción:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### Frontend → Vercel

1. Conecta el repositorio y selecciona `frontend/` como directorio raíz.
2. Añade la variable `VITE_API_URL` con la URL de Railway en el panel de Vercel.
3. Vercel compila y despliega automáticamente en cada push a `main`.

---

## 🔐 Seguridad Implementada

- Autenticación JWT con expiración de 24h y diferenciación de errores (expirado / inválido / no activo)
- Hashing de contraseñas con bcrypt (cost 12)
- Consentimiento GDPR obligatorio con timestamp de auditoría
- Rate limiting global contra abuso de API
- Procesamiento documental en memoria (sin escritura en disco)
- Hash SHA-256 de cada documento procesado
- CORS restringido al dominio de producción (`FRONTEND_URL`)
- Normalización de nombres en AML para evitar falsos negativos por tildes o guiones

---

## 📊 Estado Técnico Detallado

### Backend
- ✅ Arquitectura en capas estable
- ✅ Todos los endpoints operativos en producción
- ✅ Pipeline KYC de extremo a extremo
- ✅ Generación PDF en una sola página
- ✅ OCR funcional con Tesseract.js
- ✅ Fuzzy matching con umbral calibrado (≥ 75%)
- ✅ AML con OpenSanctions + lista negra local + normalización de nombres
- ✅ Informe narrativo con Groq IA

### Frontend
- ✅ Autenticación completa (registro / login / recuperar contraseña)
- ✅ Datos personales con email bloqueado tras registro
- ✅ Subida documental con drag & drop
- ✅ Polling automático de verificación
- ✅ Resultado con Trust Score, Fraud Score y Doc Score
- ✅ Alerta visual AML con bloqueo automático
- ✅ Descarga de informe PDF

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
