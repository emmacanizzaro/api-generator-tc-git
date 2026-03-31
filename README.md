# 🏦 CardForge — Virtual Card Generator API

**Proyecto personal fullstack** que permite emitir y gestionar tarjetas virtuales Stripe en tiempo real, con panel de control propio.

## ¿Qué hace?

- 🪪 **Emite tarjetas virtuales** con un click usando Stripe Issuing (sandbox/producción)
- 🔒 **Revela número y CVC** de forma segura bajo demanda (sin persistir datos sensibles)
- ❄️ **Congela / cancela** tarjetas al instante
- 📊 **Dashboard de métricas** en tiempo real (activas, congeladas, por expirar)
- 📤 **Exporta a CSV** con filtros por estado
- 👥 **Roles admin / viewer** con autenticación JWT

## Highlights técnicos

- API REST protegida con JWT y control de roles por endpoint
- Reveal de PAN/CVC efímero: se consulta a Stripe en tiempo real, nunca se almacena
- Deploy-ready en Render.com (`render.yaml` incluido)
- Versionado semántico: `v1.0.0` → `v1.1.0` → `v1.2.0`

---

## 🛠️ Stack Tecnológico

```
Frontend:  HTML5, CSS3, JavaScript (Vanilla)
Backend:   Node.js v18+, Express.js
Database:  SQLite (better-sqlite3)
API:       Stripe Issuing (Sandbox)
Auth:      JWT (jsonwebtoken), roles: admin / viewer
Deploy:    Render.com (render.yaml incluido)
Config:    dotenv
```

## 📁 Estructura del Proyecto

```
API Generador de TC/
├── frontend/
│   ├── index.html       # Interfaz principal
│   ├── styles.css       # Estilos modernos
│   └── app.js           # Lógica del cliente
├── backend/
│   ├── server.js        # Servidor Express
│   ├── package.json     # Dependencias
│   ├── .env.example     # Variables de entorno (plantilla)
│   ├── .env             # Variables de entorno (local, no versionado)
│   ├── routes/
│   │   └── cards.js     # Rutas de API
│   ├── services/
│   │   └── provider.js  # Lógica de integración con Stripe
│   └── data/
│       └── cards.db     # Base de datos SQLite (generada)
└── README.md            # Este archivo
```

## 🚀 Instalación y Configuración

### Requisitos Previos

1. **Node.js** v18 o superior - [Descargar](https://nodejs.org/)
2. **Cuenta en Stripe** - [Créate una gratis](https://stripe.com)
3. **Acceso a Stripe Issuing** en modo Sandbox

### Paso 1: Clonar o Descargar el Proyecto

```bash
cd /Users/emmanuelcanizzaro/Desktop/'Proyectos de Apps'/'API Generador de TC'
```

### Paso 2: Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### Paso 3: Configurar Variables de Entorno

#### 3.1 Copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

#### 3.2 Obtener claves de Stripe:

1. **Acceder a Stripe Dashboard**:
   - Ir a: https://dashboard.stripe.com/apikeys
   - Asegúrate de estar en modo **Test** (switch en superior izquierda)

2. **Copiar claves**:
   - **Secret Key** (comienza con `sk_test_...`) → pegar en `.env` como `STRIPE_API_KEY`
   - **Publishable Key** (comienza con `pk_test_...`) → pegar como `STRIPE_PUBLIC_KEY`

3. **Editar `.env`** en el directorio `backend/`:

```bash
# .env
PORT=3000
NODE_ENV=development
PROVIDER=stripe

# ⚠️  IMPORTANTE: Usar claves de PRUEBA (comienzan con sk_test_ / pk_test_)
STRIPE_API_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
```

### Paso 4: Crear un Cardholder en Stripe

Las tarjetas virtuales requieren un **cardholder** (titular de cuenta) previo. Hacer esto una sola vez:

#### Opción A: Desde el Dashboard de Stripe

1. Ir a: https://dashboard.stripe.com/test/issuing/cardholders
2. Click en **"Create cardholder"**
3. Completar formulario:
   - Nombre: ej. "Test User"
   - Email: ej. "test@example.com"
   - Verificar identidad en modo test (puede ser dummy)
4. Click **"Create"**

#### Opción B: Mediante API (curl)

```bash
curl https://api.stripe.com/v1/issuing/cardholders \
  -u sk_test_YOUR_KEY: \
  -d type=individual \
  -d name="Test User" \
  -d email="test@example.com" \
  -d individual[date_of_birth][day]=1 \
  -d individual[date_of_birth][month]=1 \
  -d individual[date_of_birth][year]=1990 \
  -d individual[address][city]="San Francisco" \
  -d individual[address][country]="US" \
  -d individual[address][postal_code]="94102" \
  -d individual[address][state]="CA" \
  -d individual[address][line1]="123 Main St"
```

**Documentación oficial**: [Stripe Issuing Quickstart](https://stripe.com/docs/issuing/quickstart#create-cardholder)

### Paso 5: Ejecutar el Servidor

```bash
npm start
# O en modo desarrollo con reinicio automático:
npm run dev
```

**Salida esperada**:

```
╔════════════════════════════════════════════════════════╗
║  SERVIDOR: API Generador de Tarjetas Virtuales        ║
║  Puerto: 3000                                          ║
║  Ambiente: development                                 ║
║  Proveedor: stripe                                     ║
╚════════════════════════════════════════════════════════╝
```

### Paso 6: Acceder a la Aplicación

1. Abrir navegador: **http://localhost:3000**
2. Deberías ver la interfaz principal con:
   - Formulario para crear tarjetas
   - Lista vacía de tarjetas
   - Console de logs

## 📝 Uso de la Aplicación

### Crear una Tarjeta Virtual

1. En el campo **"Nombre del Titular"**, ingresar un nombre (mín. 3 caracteres)
2. Click en botón **"➕ Crear Tarjeta"**
3. Esperar confirmación (puede tardar 2-5 segundos)
4. La tarjeta aparecerá en la lista con:
   - Últimos 4 dígitos
   - Marca (Visa/Mastercard en sandbox)
   - Estado (Activa)
   - Fecha de creación

### Ver Detalles de Tarjeta

1. Click en la tarjeta o en botón **"Ver Detalles"**
2. Se abre modal con:
   - ID único
   - Nombre del titular
   - Tarjeta (enmascarada)
   - Estado
   - Fechas
   - Historial de acciones

### Congelar Tarjeta

1. Abrir detalles de tarjeta (click en tarjeta)
2. Click en botón **"❄️ Congelar"**
3. Confirmar acción
4. Estado cambia a "Congelada"

### Cancelar Tarjeta

1. Abrir detalles de tarjeta
2. Click en botón **"🗑️ Cancelar"**
3. ⚠️ **ADVERTENCIA**: No se puede revertir
4. Confirmar acción
5. Estado cambia a "Cancelada"

### Auto-Cancelación (10 minutos)

- Cada tarjeta creada expira automáticamente a los **10 minutos**
- Se cancela automáticamente mediante verificación periódica (cada 5 min)
- Aparecerá en logs: "Auto-cancelada tarjeta expirada"

### Consultar Logs

En la sección **"📋 Logs de Consola"**:

- ℹ️ Azul: Información general
- ✅ Verde: Operaciones exitosas
- ⚠️ Naranja: Advertencias
- ❌ Rojo: Errores

## 🔌 Endpoints de la API

### Crear Tarjeta

```http
POST /api/cards
Content-Type: application/json

{
  "holderName": "Juan Pérez",
  "currency": "usd"
}
```

**Respuesta exitosa (201)**:

```json
{
  "success": true,
  "data": {
    "id": "TC-1698765432123-ABC123XYZ",
    "stripeId": "ics_1234567890",
    "holderName": "Juan Pérez",
    "lastFour": "4242",
    "brand": "Visa",
    "status": "active",
    "createdAt": "2024-10-31T10:30:32.123Z",
    "expiresAt": "2024-10-31T10:40:32.123Z"
  }
}
```

### Listar Tarjetas

```http
GET /api/cards
```

**Respuesta**:

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "TC-xxx",
      "holderName": "Juan Pérez",
      "lastFour": "4242",
      "brand": "Visa",
      "status": "active",
      "createdAt": "2024-10-31T10:30:32.123Z"
    },
    ...
  ]
}
```

### Obtener Detalles

```http
GET /api/cards/{id}
```

### Congelar Tarjeta

```http
POST /api/cards/{id}/freeze
```

### Cancelar Tarjeta

```http
POST /api/cards/{id}/cancel
```

## 🔐 Seguridad y Cumplimiento

### PCI DSS Compliance

✅ **LO QUE NO SE ALMACENA**:

- ❌ Número completo de tarjeta
- ❌ CVV/CVC
- ❌ Datos de autenticación completos

✅ **LO QUE SE ALMACENA**:

- ✅ Últimos 4 dígitos (para referencia)
- ✅ Marca (Visa/Mastercard)
- ✅ Estado
- ✅ Metadatos (fechas, historial)

### KYC/AML

- La aplicación usa **APIs oficiales de Stripe**
- Stripe realiza validación KYC/AML internamente
- Se requiere verificación previa del usuario en Stripe
- No se implementa validación propia (delegada al proveedor)

### Validación de Inputs

- Nombre: solo letras y espacios, mín. 3 caracteres
- Ningún campo acepta caracteres especiales peligrosos
- Consultas parametrizadas en SQLite (previene SQL injection)

### Manejo de Errores

- Errores capturados sin mostrar detalles técnicos sensibles
- Logs internos en servidor para debugging
- Mensajes claros al usuario

## 🧪 Pruebas en Modo Sandbox

Stripe proporciona números de tarjeta de prueba:

| Tarjeta       | Número              | Resultado |
| ------------- | ------------------- | --------- |
| Visa          | 4242 4242 4242 4242 | Exitosa   |
| Visa (débito) | 4000 0025 0000 0003 | Exitosa   |
| Mastercard    | 5555 5555 5555 4444 | Exitosa   |
| Amex          | 3782 822463 10005   | Exitosa   |

**Fecha de vencimiento**: Cualquier fecha futura (ej: 12/25)
**CVC**: Cualquier 3 dígitos (ej: 123)

Documentación: [Testing Stripe](https://stripe.com/docs/testing)

## 🐛 Solución de Problemas

### Error: "STRIPE_API_KEY no configurada"

**Causa**: Archivo `.env` no existe o está vacío

**Solución**:

```bash
cp .env.example .env
# Editar .env y agregar STRIPE_API_KEY
```

### Error: "No hay cardholder en Stripe"

**Causa**: No se creó un cardholder previo en Stripe

**Solución**: Seguir Paso 4 de la instalación (crear cardholder)

### Error: "No se puede conectar al servidor"

**Causa**: Servidor no está corriendo o usa otro puerto

**Solución**:

```bash
# Verificar que el servidor está activo
curl http://localhost:3000/api/health

# Cambiar puerto si es necesario:
PORT=3001 npm start
```

### Las tarjetas no aparecen en la lista

**Causa**: Problema de conexión o CORS

**Solución**:

1. Abrir DevTools (F12) → Consola
2. Ver mensajes de error específicos
3. Verificar que servidor responde: `http://localhost:3000/api/health`

### Tarjetas se cancelan automáticamente

**Normal**: Esto es parte del flujo. Tarjetas **expiran a los 10 minutos** y se auto-cancelan.

Para cambiar tiempo de expiración:

- Editar `backend/services/provider.js` línea ~145:

```javascript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Cambiar 10 a otra cantidad de minutos
```

## 📚 Documentación Oficial

- [Stripe Issuing API](https://stripe.com/docs/issuing)
- [Stripe Issuing Quickstart](https://stripe.com/docs/issuing/quickstart)
- [Express.js](https://expressjs.com/)
- [SQLite](https://www.sqlite.org/)
- [Node.js](https://nodejs.org/)

## 📄 Licencia

MIT

## 👤 Autor

Creado como prototipo educativo para demostración de integración con APIs de emisión de tarjetas.

---

## 📞 Soporte

Para problemas o preguntas:

1. **Consulta los logs** en la sección "📋 Logs de Consola"
2. **Abre DevTools** (F12) y mira la consola del navegador
3. **Revisa la terminal** donde corre el servidor (puede haber mensajes de error)
4. **Verifica Stripe Dashboard** para confirmar que las tarjetas se crean en Stripe

---

**Estado**: ✅ Producción de prueba
**Última actualización**: Octubre 2024
