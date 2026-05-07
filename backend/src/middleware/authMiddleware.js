const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rutas (RNF-01)
 * Verifica que el token JWT sea válido antes de permitir el acceso.
 */
const protect = (req, res, next) => {
  // 1. Obtener el token de la cabecera 'Authorization' (Bearer Token)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No autorizado: No se proporcionó un token válido.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verificar el token usando la clave secreta del .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Añadir los datos del usuario decodificados al objeto 'req'
    req.user = decoded; 
    
    next(); // Continuar al siguiente paso (controlador)
  } catch (error) {
    console.error('Error de autenticación:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = { protect };