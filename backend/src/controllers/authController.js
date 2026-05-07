const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Función Register
const register = async (req, res) => {
  try {
    const { email, password, gdpr_consent } = req.body;

    if (!gdpr_consent) {
      return res.status(400).json({ error: 'Debes aceptar el consentimiento GDPR para continuar.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        gdprConsentAt: new Date(),
        role: 'USER'
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_temporal_123',
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.passwordHash); 
    if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_temporal_123',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
};

// EXPORTACIÓN UNIFICADA
module.exports = {
  register,
  login
};