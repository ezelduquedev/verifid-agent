const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Sin extensión

// Verificación de seguridad: si el controlador no cargó, lanzamos un error claro
if (!authController) {
    throw new Error("No se pudo cargar authController. Revisa la ruta en src/routes/auth.js");
}

// Estas rutas son públicas
router.post('/register', authController.register); 
router.post('/login', authController.login);

module.exports = router;