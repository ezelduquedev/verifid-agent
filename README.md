🚀 VerifID Agent

Sistema KYC (Know Your Customer) con Inteligencia Artificial orientado a validación documental, análisis de riesgo y generación automatizada de informes.

Simula la arquitectura utilizada por fintechs y plataformas RegTech para procesos de verificación de identidad.

📌 Estado Actual

Fecha: 7 de mayo de 2026

El backend se encuentra arquitectónicamente completo y funcional en entorno de pruebas.
El frontend React está en integración activa.

El sistema permite ejecutar el flujo KYC completo desde entorno técnico (Postman), incluyendo:

Registro y autenticación con JWT
Captura de datos personales
Subida de documentación
OCR con Tesseract
Fuzzy matching
Análisis AML / PEP
Generación de informe narrativo con IA
Emisión de PDF dinámico

⚠️ Actualmente los módulos de OCR, fuzzy matching e integración AML/IA se encuentran en fase de calibración para mejorar precisión antes de despliegue en producción.

🧱 Fases del Proyecto
Fase	Estado
Infraestructura (Monorepo + Prisma + Supabase)	✅ Completado
Autenticación (JWT + bcrypt + GDPR)	✅ Completado
Gestión Documental (OCR + Multer + Hash)	🟡 Implementado – En calibración
IA y Scoring de Riesgo	🟡 Implementado – En validación
Frontend React (UX multi-step)	🟡 En curso
Despliegue (Railway + Vercel)	⏳ Pendiente

🏗 Arquitectura
verifid-agent/
├── backend/   → API REST + lógica KYC
└── frontend/  → Interfaz React + flujo multi-step 

📂 Estructura del Proyecto
verifid-agent/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   └── verifyController.js
│   │   │
│   │   ├── lib/
│   │   │   └── prisma.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── rateLimiter.js
│   │   │
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── user.js
│   │   │   └── verify.js
│   │   │
│   │   ├── services/
│   │   │   ├── amlService.js
│   │   │   ├── claudeService.js
│   │   │   ├── ocrService.js
│   │   │   └── pdfService.js
│   │   │
│   │   └── index.js
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
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   │
│   │   ├── components/
│   │   │   ├── AuthForm.jsx
│   │   │   └── UploadZone.jsx
│   │   │
│   │   ├── hooks/
│   │   │
│   │   ├── pages/
│   │   │   └── StepDatos.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── vite.config.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md

Backend

Arquitectura en capas:

Controllers → Gestión de requests
Services → Lógica de negocio
Routes → Definición de endpoints
Middleware → Autenticación y seguridad
Prisma ORM → Persistencia de datos
Frontend
Flujo guiado por pasos
Polling automático de verificación
Gestión de sesión con JWT
Interfaz responsive con React + Vite

⚙️ Stack Tecnológico
Backend
Node.js
Express
Prisma ORM
PostgreSQL (Supabase)
JWT
bcryptjs
Multer
Tesseract.js
fuzzball (Fuzzy Matching)
Anthropic Claude API
OpenSanctions API
PDFKit
Frontend
React
Vite
Axios
React Hooks
CSS Grid

🔎 Flujo KYC
Usuario
   ↓
Registro / Login
   ↓
Datos personales
   ↓
Subida de documento
   ↓
OCR (Tesseract)
   ↓
Fuzzy Matching
   ↓
AML / PEP Check
   ↓
Análisis IA (Claude)
   ↓
Scoring final
   ↓
Generación PDF
   ↓
Resultado KYC

🔐 Seguridad Implementada
Autenticación JWT con expiración
Hashing bcrypt (cost 12)
Consentimiento GDPR obligatorio con timestamp
Rate limiting
Procesamiento documental en memoria
Hash SHA-256 de documentos
Proxy seguro para APIs externas
Fallbacks ante errores de red

📊 Estado Técnico Detallado Backend

✔ Arquitectura estable
✔ Endpoints principales operativos
✔ Pipeline KYC implementado
✔ Generación PDF funcional

🟡 OCR requiere mejora en reconocimiento con documentos ficticios
🟡 Umbral de fuzzy matching en ajuste
🟡 Validación real de coincidencias AML pendiente
🟡 Refinamiento de prompts IA en progreso

El sistema es funcional estructuralmente, pero se encuentra en fase de optimización de precisión.

Frontend

✔ Autenticación implementada
✔ Captura de datos personales
✔ Subida documental
✔ Polling de verificación

Pendiente:

StepAnalisis.jsx
StepResultado.jsx
RiskScoreGrid
Hook useVerification
Testing UX completo

🔧 Instalación
Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
Frontend
cd frontend
npm install
npm run dev

🌱 Variables de Entorno
Backend (.env)
DATABASE_URL=
JWT_SECRET=
ANTHROPIC_API_KEY=
OPENSANCTIONS_API_KEY=
PORT=3000
Frontend (.env)
VITE_API_URL=http://localhost:3000

🚧 Próximos Pasos
Ajustar umbral de fuzzy matching
Mejorar preprocesamiento OCR
Validar coincidencias AML reales
Refinar prompts IA
Finalizar pantallas de resultados
Ejecutar casos de prueba estructurados
Despliegue Railway (backend) + Vercel (frontend)

🎯 Objetivo del Proyecto

Construir una arquitectura KYC moderna y modular que pueda evolucionar hacia:

Biometría facial
Detección antifraude avanzada
Panel administrativo
Workflows empresariales
Trazabilidad regulatoria

💡 Valor Técnico

Este proyecto demuestra integración real de:

IA generativa
OCR
Análisis AML
Arquitectura asíncrona
Procesamiento documental seguro
Diseño fullstack desacoplado

La complejidad principal reside en la coordinación de múltiples servicios asíncronos dentro de un pipeline coherente de verificación.

👨‍💻 Autor

Ezel Alexander Duque Arias
Proyecto desarrollado como sistema de prácticas enfocado en arquitectura fullstack aplicada a KYC, IA y análisis de riesgo.
