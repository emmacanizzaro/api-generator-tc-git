# 🧪 PRUEBAS DE API

Guía para probar los endpoints de la aplicación manualmente.

## 🛠️ Herramientas Necesarias

- **cURL** (Terminal): `curl` (viene por defecto en macOS)
- **Postman**: https://www.postman.com/downloads/
- **Insomnia**: https://insomnia.rest/
- **VS Code REST Client**: Extensión `REST Client`

## ✅ Pre-requisitos

1. Servidor corriendo: `npm start` en carpeta `backend/`
2. Verificar salud: `curl http://localhost:3000/api/health`

---

## 📋 Pruebas con cURL

### 1️⃣ Verificar Servidor (Health Check)

```bash
curl http://localhost:3000/api/health
```

**Respuesta esperada**:
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente"
}
```

---

### 2️⃣ Crear Tarjeta Virtual

```bash
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{
    "holderName": "Juan Pérez",
    "currency": "usd"
  }'
```

**Respuesta exitosa (201)**:
```json
{
  "success": true,
  "data": {
    "id": "TC-1698765432123-ABC123",
    "stripeId": "ics_1234567890",
    "holderName": "Juan Pérez",
    "lastFour": "4242",
    "brand": "Visa",
    "status": "active",
    "createdAt": "2024-10-31T10:30:32.123Z",
    "expiresAt": "2024-10-31T10:40:32.123Z",
    "message": "Tarjeta virtual emitida. Expirará en 10 minutos (modo sandbox)."
  },
  "message": "Tarjeta virtual creada exitosamente en sandbox"
}
```

**Errores comunes**:

❌ `"No hay cardholder en Stripe"`:
- Crear cardholder primero (ver README.md)

❌ `"STRIPE_API_KEY no configurada"`:
- Crear `.env` con clave (ver SETUP.md)

---

### 3️⃣ Listar Todas las Tarjetas

```bash
curl http://localhost:3000/api/cards
```

**Respuesta**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "TC-xxx",
      "holderName": "Juan Pérez",
      "lastFour": "4242",
      "brand": "Visa",
      "status": "active",
      "createdAt": "2024-10-31T10:30:32.123Z",
      "expiresAt": "2024-10-31T10:40:32.123Z"
    },
    {
      "id": "TC-yyy",
      "holderName": "María García",
      "lastFour": "5555",
      "brand": "Mastercard",
      "status": "frozen",
      "createdAt": "2024-10-31T10:25:00.000Z",
      "expiresAt": "2024-10-31T10:35:00.000Z"
    }
  ]
}
```

---

### 4️⃣ Obtener Detalles de Tarjeta

```bash
# Reemplazar {id} con el ID real de la tarjeta
curl http://localhost:3000/api/cards/TC-1698765432123-ABC123
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": "TC-xxx",
    "stripeId": "ics_1234567890",
    "holderName": "Juan Pérez",
    "lastFour": "4242",
    "brand": "Visa",
    "status": "active",
    "createdAt": "2024-10-31T10:30:32.123Z",
    "expiresAt": "2024-10-31T10:40:32.123Z",
    "actionHistory": [
      {
        "action": "created",
        "timestamp": "2024-10-31T10:30:32.123Z"
      }
    ]
  }
}
```

---

### 5️⃣ Congelar Tarjeta

```bash
curl -X POST http://localhost:3000/api/cards/TC-xxx/freeze
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Tarjeta congelada exitosamente",
  "cardId": "TC-xxx"
}
```

---

### 6️⃣ Cancelar Tarjeta

```bash
# ⚠️  NO se puede revertir
curl -X POST http://localhost:3000/api/cards/TC-xxx/cancel
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Tarjeta cancelada exitosamente",
  "cardId": "TC-xxx"
}
```

---

## 📦 Pruebas con Postman

### Importar Colección

1. Abrir Postman
2. **File** → **New** → **HTTP Request**
3. Crear las siguientes peticiones:

#### Request 1: Listar Tarjetas
- **Method**: GET
- **URL**: `http://localhost:3000/api/cards`
- Click **Send**

#### Request 2: Crear Tarjeta
- **Method**: POST
- **URL**: `http://localhost:3000/api/cards`
- **Headers**: `Content-Type: application/json`
- **Body** (raw):
```json
{
  "holderName": "Juan Pérez",
  "currency": "usd"
}
```
- Click **Send**

#### Request 3: Congelar
- **Method**: POST
- **URL**: `http://localhost:3000/api/cards/{id}/freeze`
- Click **Send**

#### Request 4: Cancelar
- **Method**: POST
- **URL**: `http://localhost:3000/api/cards/{id}/cancel`
- Click **Send**

---

## 🔍 Casos de Prueba

### Caso 1: Flujo Completo

1. **Listar** (vacío esperado)
2. **Crear** tarjeta para "Juan Pérez"
3. **Verificar** que aparece en lista
4. **Ver detalles**
5. **Congelar** tarjeta
6. **Verificar** estado = "frozen"
7. **Crear** otra tarjeta para "María García"
8. **Cancelar** la segunda
9. **Verificar** ambas en lista (congelada y cancelada)

### Caso 2: Validación de Inputs

Intentar crear tarjeta con datos inválidos:

```bash
# ❌ Nombre muy corto
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{"holderName": "AB"}'

# ❌ Nombre con caracteres especiales
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{"holderName": "Juan@123"}'

# ❌ Nombre vacío
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{"holderName": ""}'
```

**Resultado**: Errores HTTP 400 (Bad Request)

### Caso 3: ID Inexistente

```bash
curl http://localhost:3000/api/cards/INVALID_ID
```

**Resultado**: Error HTTP 404 (Not Found)

### Caso 4: Auto-Cancelación

1. Crear tarjeta
2. Esperar **10 minutos** (o cambiar tiempo en código)
3. Listar tarjetas
4. **Verificar** que estado = "cancelled" automáticamente

---

## 📊 Verificar Base de Datos

Base de datos SQLite se guarda en: `backend/data/cards.db`

### Ver contenido (macOS Terminal)

```bash
# Instalar sqlite3 si no lo tienes
brew install sqlite3

# Consultar tarjetas
sqlite3 ~/Desktop/'Proyectos de Apps'/'API Generador de TC'/backend/data/cards.db "SELECT * FROM virtual_cards;"

# Salir
.quit
```

---

## 📈 Métricas a Verificar

✅ **Tiempos de Respuesta**:
- GET `/cards`: < 100ms
- POST `/cards`: 1-3s (incluye llamada a Stripe)
- POST `/cards/:id/freeze`: 1-2s
- POST `/cards/:id/cancel`: 1-2s

✅ **Errores**:
- Validación de inputs: HTTP 400
- Recurso no encontrado: HTTP 404
- Error del servidor: HTTP 500 (raro)

✅ **Base de Datos**:
- Tarjetas se guardan en `cards.db`
- Historial de acciones se registra (JSON)
- Datos sensibles NO se almacenan

---

## 🐛 Debug

### Ver logs del servidor

En Terminal donde corre `npm start`, verás:
```
[2024-10-31T10:30:32.123Z] POST /api/cards
[PROVIDER] Creando tarjeta virtual para: Juan Pérez
[PROVIDER] ✅ Tarjeta creada: ics_1234567890
```

### Editor DevTools (Frontend)

en navegador (http://localhost:3000):
1. Presionar **F12** (DevTools)
2. Ir a **Network** tab
3. Realizar acciones en app
4. Ver requests HTTP en tiempo real

---

## ✨ Casos Exitosos

✅ Crear, listar, congelar, cancelar
✅ Auto-cancelación a los 10 minutos
✅ Historial de acciones
✅ Validación de inputs
✅ Manejo de errores
✅ Logs claros

---

**¡Listo para probar! 🧪**
