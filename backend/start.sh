#!/bin/bash

# ========================================
# Script de Inicio - API Generador de TC
# ========================================
# USO: ./start.sh
# DESCRIPCIÓN: Inicia automáticamente el servidor en puerto 3000

echo "🚀 Iniciando API Generador de Tarjetas Virtuales..."
echo ""

# Verificar si estamos en la carpeta correct
if [ ! -f "server.js" ]; then
  echo "❌ Error: Ejecutar desde carpeta 'backend/'"
  echo "   cd backend && ./start.sh"
  exit 1
fi

# Verificar si existe .env
if [ ! -f ".env" ]; then
  echo "⚠️  ADVERTENCIA: archivo .env no encontrado"
  echo "   1. Copiar: cp .env.example .env"
  echo "   2. Editar .env con tu STRIPE_API_KEY"
  echo ""
fi

# Iniciar servidor
echo "📝 Iniciando en puerto 3000..."
echo "🌐 Abre navegador en: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

npm start
