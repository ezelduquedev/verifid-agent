<h1>🛡️ VerifID Agent - Sistema de Verificación de Identidad con IA</h1>

<p align="left">
  <strong>VerifID Agent</strong> es una solución integral para la verificación de identidad automatizada, cumplimiento normativo (GDPR/AML) y análisis de riesgo mediante Inteligencia Artificial. El sistema utiliza <strong>Node.js</strong> para la orquestación, <strong>Prisma</strong> como ORM, y <strong>Supabase</strong> para la persistencia de datos distribuida.
</p>

<hr>

<h2>📂 Estructura Real del Proyecto (Monorepo)</h2>
<p>La arquitectura actual del repositorio está organizada de la siguiente manera, separando las responsabilidades de cliente y servidor:</p>

<pre><code>
verifid-agent/
├── backend/                # Lógica del Servidor (API REST)
│   ├── controllers/        # Lógica de negocio (User, Admin, Verify)
│   ├── routes/             # Endpoints (userRoutes.js, adminRoutes.js)
│   ├── prisma/             # Modelado de datos (schema.prisma)
│   ├── .env                # Configuración de base de datos (Oculto)
│   ├── index.js            # Servidor principal Express
│   ├── package.json        # Dependencias del Backend
│   └── package-lock.json
├── frontend/               # Interfaz de Usuario (Cliente)
│   ├── src/                # Código fuente de la aplicación
│   ├── public/             # Recursos estáticos (Assets)
│   ├── index.html          # Punto de entrada de la interfaz
│   ├── package.json        # Dependencias del Frontend (Inicializado)
│   └── package-lock.json
├── .gitignore              # Filtros de exclusión de Git
└── README.md               # Documentación general
</code></pre>

<hr>

<h2>🚀 Estado del Desarrollo (Hitos Alcanzados)</h2>

<table border="1">
  <thead>
    <tr>
      <th>Fase</th>
      <th>Módulo / Tarea</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1</strong></td>
      <td><strong>Infraestructura:</strong> Repositorio Git unificado, Prisma ORM y Supabase Cloud.</td>
      <td>✅ COMPLETADO</td>
    </tr>
    <tr>
      <td><strong>1</strong></td>
      <td><strong>Arquitectura:</strong> Estructura Monorepo y organización de directorios.</td>
      <td>✅ COMPLETADO</td>
    </tr>
    <tr>
      <td><strong>2</strong></td>
      <td><strong>Lógica:</strong> Controladores de usuario y administración vinculados a base de datos.</td>
      <td>✅ COMPLETADO</td>
    </tr>
    <tr>
      <td><strong>3</strong></td>
      <td><strong>Procesamiento:</strong> OCR y validación de documentos (DNI/Pasaporte).</td>
      <td>⏳ PENDIENTE</td>
    </tr>
    <tr>
      <td><strong>4</strong></td>
      <td><strong>IA:</strong> Análisis de riesgo narrativo con Claude API.</td>
      <td>⏳ DISEÑADO</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>🛠️ Guía de Inicio Rápido</h2>

<p>Para poner en marcha el entorno de desarrollo, sigue estas instrucciones:</p>

<h3>Configuración del Backend</h3>
<pre><code>
cd backend
npm install
# Asegúrate de tener el archivo .env configurado con DATABASE_URL
npx prisma db push
npm run dev
</code></pre>

<h3>Configuración del Frontend</h3>
<pre><code>
cd ../frontend
npm install
</code></pre>

<hr>

<h2>🛡️ Seguridad y Cumplimiento</h2>
<ul>
  <li><strong>Criptografía:</strong> Hashing de contraseñas mediante <code>bcrypt</code> (coste 12) para máxima seguridad de identidad[cite: 1].</li>
  <li><strong>Privacidad:</strong> Diseño orientado al cumplimiento del <strong>GDPR</strong> con registro de consentimiento[cite: 1].</li>
  <li><strong>Persistencia:</strong> Base de datos PostgreSQL escalable mediante <strong>Supabase</strong> con Transaction Pooling[cite: 1].</li>
</ul>

<hr>

<p align="center">
  <em>Proyecto de prácticas - Agente de Verificación de Identidad con IA (2026)</em>
</p>
