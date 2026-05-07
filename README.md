VerifID Agent

Sistema KYC (Know Your Customer) con Inteligencia Artificial orientado a validación documental, análisis de riesgo y generación automatizada de informes.

Estado Actual del Proyecto
Situación General

VerifID Agent se encuentra en una fase avanzada de desarrollo.

A fecha del 7 de mayo de 2026, la arquitectura del backend está completamente implementada y el frontend React se encuentra en integración activa.

El sistema ya permite ejecutar el flujo KYC completo en entorno de pruebas técnicas (Postman), incluyendo:

Registro y autenticación del usuario.
Captura de datos personales.
Subida de documentación.
Procesamiento OCR.
Cruce AML / PEP.
Análisis de riesgo mediante IA.
Generación automática de informe PDF.

No obstante, los módulos de OCR, fuzzy matching e integración AML/IA se encuentran actualmente en fase de calibración y validación con datasets más realistas antes de considerarse completamente robustos para producción.

El proyecto está entrando en fase de estabilización técnica, mejora de precisión y finalización del frontend.

Fases del Proyecto
Fase	Estado
Infraestructura (Monorepo, Prisma, Supabase)	✅ Completado
Autenticación (JWT, bcrypt, GDPR)	✅ Completado
Gestión Documental (OCR, Multer, Hashing)	🟡 Implementado – En calibración
IA y Riesgo (Claude, AML, PDF)	🟡 Implementado – En validación
Frontend React (Steps, polling, UX)	🟡 En curso
Despliegue (Railway + Vercel)	⏳ Pendiente
Arquitectura General

El proyecto está dividido en dos aplicaciones principales:

VerifID Agent
├── backend/ → API REST + lógica KYC
└── frontend/ → Interfaz React + flujo de verificación

La arquitectura sigue una separación clara por capas:

Controllers → manejo de requests.
Services → lógica de negocio.
Routes → definición de endpoints.
Middleware → autenticación y seguridad.
Prisma → persistencia de datos.
Frontend React → flujo multi-step del usuario.
Backend
Objetivo

El backend centraliza toda la lógica KYC:

autenticación,
OCR,
análisis AML,
scoring,
generación de informes,
orquestación asíncrona del pipeline de verificación.
Estado Técnico del Backend

La arquitectura está completamente implementada y los endpoints principales están operativos.

El flujo KYC puede ejecutarse en entorno de pruebas, pero requiere ajuste fino en:

extracción OCR con documentos ficticios o imágenes de baja calidad,
calibración del umbral de fuzzy matching (actualmente 75%),
validación real de coincidencias AML,
consistencia del informe generado por IA cuando el OCR devuelve datos incompletos.

El sistema es funcional desde el punto de vista estructural, pero aún se encuentra en fase de optimización de precisión.

Servicios Backend
ocrService.js

Servicio OCR basado en Tesseract.js.

Características:

OCR en español.
Procesamiento en memoria.
Sin escritura en disco.
Manejo de errores con fallback seguro.

Estado actual:

Funciona correctamente en pruebas técnicas, pero requiere mejora de preprocesamiento de imagen y validación con documentos reales para aumentar la tasa de reconocimiento.

amlService.js

Encargado del análisis AML/PEP.

Incluye:

Integración estructural con OpenSanctions.
Umbral de coincidencia configurable (80%).
Fallback seguro ante errores de red.
Modo demo sin API Key.

Estado actual:

La integración está implementada, pero requiere pruebas adicionales con coincidencias reales para validar precisión y evitar falsos positivos.

claudeService.js

Proxy seguro hacia Anthropic Claude.

Funciones:

generación de informes narrativos,
prompts adaptativos según veredicto,
análisis contextual del riesgo.

Estado actual:

Integración funcional.
La calidad del informe depende directamente de la calidad del texto extraído por OCR, por lo que aún se encuentra en fase de ajuste de prompts y validación de consistencia.

pdfService.js

Genera informes PDF dinámicos en memoria.

Contenido del informe:

resultado KYC,
scores,
datos OCR,
estado AML,
análisis IA,
referencia a cumplimiento RGPD.

Estado: Funcional y estable.

Frontend
Estado Actual

El frontend está en desarrollo activo.

Actualmente incluye:

Sistema de autenticación (AuthForm).
Captura de datos personales (StepDatos).
Subida documental (UploadZone).
Orquestación de pasos en App.jsx.
Sistema de polling automático para consultar estado de verificación.

Pendiente:

StepAnalisis.jsx (pantalla de procesamiento).
StepResultado.jsx (visualización de scores).
Hook reutilizable useVerification.
Componente RiskScoreGrid.
Estado Técnico Actual
Backend

✅ Arquitectura estable
✅ Endpoints principales operativos
✅ Pipeline KYC implementado
🟡 OCR en calibración
🟡 Fuzzy matching en ajuste
🟡 Integración AML en validación
🟡 Integración IA en refinamiento
✅ Generación PDF funcional

Frontend

🟡 Flujo multi-step parcialmente completado
🟡 Visualización final pendiente
🟡 Componentes de scoring pendientes
🟡 Testing de experiencia de usuario pendiente

Próximos Pasos
Ajustar umbral de fuzzy matching.
Mejorar preprocesamiento OCR.
Validar coincidencias AML reales.
Refinar prompts de Claude.
Finalizar pantallas de resultados.
Ejecutar casos de prueba TC-01 → TC-08.
Preparar despliegue Railway / Vercel.
Objetivo del Proyecto

VerifID Agent simula una arquitectura KYC moderna similar a la utilizada por:

fintechs,
bancos digitales,
plataformas de onboarding,
sistemas RegTech.

Está diseñado con una arquitectura modular que permite evolucionar hacia:

biometría facial,
detección antifraude avanzada,
workflows enterprise,
panel administrativo,
trazabilidad regulatoria.
Valor Técnico del Proyecto

El proyecto demuestra la integración real de:

IA generativa,
OCR,
análisis AML,
arquitectura asíncrona,
procesamiento documental,
seguridad backend,
workflows KYC.

La principal complejidad técnica ha sido la coordinación de múltiples servicios asíncronos dentro de un pipeline coherente, así como la gestión del estado de verificación sin bloquear las respuestas HTTP.

Actualmente el proyecto se encuentra en fase de estabilización y mejora de precisión antes del despliegue en producción.

Autor

Ezel Alexander Duque Arias
Proyecto desarrollado como sistema de prácticas y aprendizaje avanzado de arquitectura fullstack aplicada a KYC, IA y análisis de riesgo.
