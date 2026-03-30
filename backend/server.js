/**
 * SERVIDOR PRINCIPAL - API Generador de Tarjetas Virtuales
 * 
 * Stack: Node.js + Express
 * Propósito: Conectar con APIs oficiales de emisión de tarjetas en sandbox
 * Seguridad: PCI DSS compliance (NO almacenar datos sensibles completos)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importar rutas
const cardsRouter = require('./routes/cards');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir frontend estático
app.use(express.static(path.join(__dirname, '../frontend')));

// ============ LOGGING MIDDLEWARE ============
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============ RUTAS ============
app.use('/api/cards', cardsRouter);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Ruta raíz - servirá index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============ MANEJO DE ERRORES ============
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
});

// ============ INICIAR SERVIDOR ============
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║  SERVIDOR: API Generador de Tarjetas Virtuales        ║
  ║  Puerto: ${PORT}                                            ║
  ║  Ambiente: ${process.env.NODE_ENV || 'development'}                            ║
  ║  Proveedor: ${process.env.PROVIDER || 'stripe'}                               ║
  ╚════════════════════════════════════════════════════════╝
  `);
  
  if (!process.env.STRIPE_API_KEY) {
    console.warn('⚠️  ADVERTENCIA: STRIPE_API_KEY no está configurada en .env');
  }
});

module.exports = app;
