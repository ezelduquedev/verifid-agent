# VerifID Agent

Sistema KYC (Know Your Customer) con Inteligencia Artificial orientado a validación documental, análisis de riesgo y generación automatizada de informes.

---

# Estado Actual del Proyecto

## Situación General

VerifID Agent se encuentra actualmente en una fase avanzada de desarrollo.

A fecha del **7 de mayo de 2026**, el backend ha sido completado funcionalmente y el frontend React se encuentra en integración activa.

El sistema ya es capaz de ejecutar el flujo KYC completo de extremo a extremo:

1. Registro y autenticación del usuario.
2. Captura de datos personales.
3. Subida de documentación.
4. Procesamiento OCR.
5. Cruce AML / PEP.
6. Análisis de riesgo mediante IA.
7. Generación automática de informe PDF.

Actualmente el proyecto se encuentra entrando en la fase final de experiencia de usuario, visualización de resultados y preparación para despliegue en producción.

---

# Fases del Proyecto

| Fase                                         | Estado       |
| -------------------------------------------- | ------------ |
| Infraestructura (Monorepo, Prisma, Supabase) | ✅ Completado |
| Autenticación (JWT, bcrypt, GDPR)            | ✅ Completado |
| Gestión Documental (OCR, Multer, Hashing)    | ✅ Completado |
| IA y Riesgo (Claude, AML, PDF)               | ✅ Completado |
| Frontend React (Steps, polling, UX)          | 🟡 En curso  |
| Despliegue (Railway + Vercel)                | ⏳ Pendiente  |

---

# Arquitectura General

El proyecto está dividido en dos aplicaciones principales:

```text
VerifID Agent
├── backend/   → API REST + lógica KYC
└── frontend/  → Interfaz React + flujo de verificación
```

La arquitectura sigue una separación clara por capas:

* Controllers → manejo de requests.
* Services → lógica de negocio.
* Routes → definición de endpoints.
* Middleware → autenticación y seguridad.
* Prisma → persistencia de datos.
* Frontend React → flujo multi-step del usuario.

---

# Tecnologías Utilizadas

## Backend

* Node.js
* Express
* Prisma ORM
* PostgreSQL / Supabase
* JWT
* bcryptjs
* Multer
* Tesseract.js
* Anthropic Claude API
* PDFKit
* fuzzball

## Frontend

* React
* Vite
* Axios
* CSS Grid
* Hooks React

---

# Estructura del Proyecto

```text
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
```

---

# Backend

## Objetivo

El backend centraliza toda la lógica KYC:

* autenticación,
* OCR,
* análisis AML,
* scoring,
* generación de informes,
* y orquestación del pipeline de verificación.

---

## Controladores

### authController.js

Gestiona:

* registro,
* login,
* validación GDPR,
* emisión de JWT.

Características implementadas:

* Hashing seguro con bcryptjs.
* Consentimiento GDPR obligatorio.
* Tokens JWT con expiración.
* Registro de auditoría del consentimiento.

---

### verifyController.js

Es el núcleo del sistema KYC.

Endpoints implementados:

#### startVerification

* Recibe datos declarados.
* Crea el proceso de verificación.
* Persiste información para el análisis posterior.

#### uploadDocument

* Recibe imágenes mediante Multer.
* Ejecuta OCR.
* Calcula hash SHA-256.
* Guarda información documental.

#### runFullAnalysis

Motor asíncrono que ejecuta:

* OCR,
* fuzzy matching,
* análisis AML,
* IA generativa,
* scoring final.

#### getResult

Devuelve:

* docScore,
* fraudScore,
* trustScore,
* informe IA,
* estado AML.

#### downloadReport

Genera y devuelve el PDF directamente en memoria.

---

# Servicios Backend

## ocrService.js

Servicio OCR basado en Tesseract.js.

Características:

* OCR en español.
* Procesamiento en memoria.
* Sin archivos temporales.
* Manejo robusto de errores.

---

## amlService.js

Encargado del análisis AML/PEP.

Incluye:

* Integración con OpenSanctions.
* Umbral de coincidencia configurable.
* Fallback seguro.
* Modo demo sin API Key.

---

## claudeService.js

Proxy seguro hacia Anthropic Claude.

Funciones:

* generación de informes narrativos,
* prompts adaptativos,
* análisis contextual del riesgo.

---

## pdfService.js

Genera informes PDF dinámicos.

Contenido del informe:

* resultado KYC,
* scores,
* datos OCR,
* estado AML,
* análisis IA,
* cumplimiento RGPD.

---

# Frontend

## Objetivo

El frontend guía al usuario durante todo el proceso KYC mediante un flujo multi-step.

---

## App.jsx

Actúa como orquestador principal.

Funciones actuales:

* Router por pasos.
* Barra de progreso.
* Gestión global de sesión.
* Polling automático.
* Gestión del estado de verificación.

---

## AuthForm.jsx

Pantalla de autenticación.

Incluye:

* login,
* registro,
* consentimiento GDPR,
* validación de formularios,
* gestión de errores.

---

## StepDatos.jsx

Primer paso del proceso KYC.

Permite:

* capturar datos personales,
* enviar información al backend,
* iniciar el proceso de verificación.

---

## UploadZone.jsx

Gestión documental.

Características:

* drag & drop,
* vista previa,
* selección de documento,
* subida segura,
* estados de carga.

---

# Flujo Completo del Sistema

```text
Usuario
   ↓
Registro / Login
   ↓
Introducción de datos
   ↓
Subida de documento
   ↓
OCR + extracción
   ↓
Fuzzy Matching
   ↓
AML / PEP Check
   ↓
Análisis IA Claude
   ↓
Scoring final
   ↓
Generación PDF
   ↓
Resultado KYC
```

---

# Seguridad Implementada

## Medidas actuales

* JWT Authentication.
* Hashing bcrypt.
* Consentimiento GDPR obligatorio.
* Rate limiting.
* Procesamiento documental en memoria.
* Hash SHA-256 documental.
* Proxy seguro para APIs externas.
* Fallbacks seguros ante errores.

---

# Variables de Entorno

## Backend (.env)

```env
DATABASE_URL=
JWT_SECRET=
ANTHROPIC_API_KEY=
OPENSANCTIONS_API_KEY=
PORT=3000
```

## Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

# Instalación

## Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Estado Técnico Actual

## Backend

✅ Arquitectura estable

✅ Endpoints principales operativos

✅ Pipeline KYC funcional

✅ OCR integrado

✅ IA integrada

✅ AML operativo

✅ Generación PDF funcional

---

## Frontend

🟡 Flujo multi-step parcialmente completado

🟡 Visualización final pendiente

🟡 Hook reutilizable de polling pendiente

🟡 Componentes de scoring pendientes

---

# Próximos Pasos

## Pendientes inmediatos

* Crear StepAnalisis.jsx.
* Crear StepResultado.jsx.
* Extraer polling a useVerification.js.
* Crear RiskScoreGrid.jsx.
* Ejecutar casos de prueba TC-01 → TC-08.
* Preparar despliegue Railway/Vercel.

---

# Objetivo del Proyecto

VerifID Agent busca simular una arquitectura KYC moderna similar a las utilizadas por:

* fintechs,
* bancos digitales,
* plataformas onboarding,
* sistemas RegTech.

El proyecto está diseñado con una arquitectura modular y escalable que permite evolucionar hacia:

* biometría facial,
* detección antifraude avanzada,
* workflows enterprise,
* panel administrativo,
* trazabilidad regulatoria.

---

# Valor Técnico del Proyecto

Este proyecto demuestra integración real de:

* IA generativa,
* OCR,
* análisis AML,
* arquitectura asíncrona,
* procesamiento documental,
* seguridad backend,
* workflows KYC.

La principal complejidad técnica ha sido la coordinación de múltiples servicios asíncronos dentro de un pipeline coherente de verificación.

---

# Autor
Ezel Alexander Duque Arias
Proyecto desarrollado como sistema de prácticas y aprendizaje avanzado de arquitectura fullstack aplicada a KYC, IA y análisis de riesgo.
