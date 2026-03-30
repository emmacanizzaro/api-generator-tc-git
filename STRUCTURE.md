# 📁 Estructura del Proyecto

Mapeo completo de archivos y carpetas con descripción de cada componente.

## 🗂️ Árbol del Proyecto

```
API Generador de TC/                          ← Carpeta RAÍZ
│
├── 📄 README.md                              ← Documentación principal
├── 📄 SETUP.md                               ← Guía rápida de inicio
├── 📄 TESTING.md                             ← Pruebas de API
├── 📄 STRUCTURE.md                           ← Este archivo
├── 📄 .gitignore                             ← Archivo ignorados por Git
│
├── 📂 frontend/                              ← INTERFAZ DE USUARIO
│   ├── 📄 index.html                         ← Página principal HTML
│   ├── 📄 styles.css                         ← Estilos CSS (responsivos)
│   └── 📄 app.js                             ← Lógica JavaScript (SPA)
│
└── 📂 backend/                               ← SERVIDOR API
    ├── 📄 server.js                          ← Punto de entrada (Express)
    ├── 📄 package.json                       ← Dependencias de Node
    ├── 📄 .env.example                       ← Plantilla de variables
    ├── 📄 .env                               ← Variables reales (NO versionado)
    ├── 📄 start.sh                           ← Script de inicio rápido
    │
    ├── 📂 routes/                            ← Enrutamiento API
    │   └── 📄 cards.js                       ← Rutas de tarjetas (/api/cards)
    │
    ├── 📂 services/                          ← Lógica de negocio
    │   └── 📄 provider.js                    ← Integración con Stripe + BD
    │
    ├── 📂 data/                              ← Datos (generado)
    │   └── 📄 cards.db                       ← Base de datos SQLite
    │
    └── 📂 node_modules/                      ← Dependencias (NO versionado)
        └── (110+ paquetes instalados)
```

---

## 📋 Descripción de Archivos

### RAÍZ DEL PROYECTO

#### `README.md`
- **Propósito**: Documentación principal y completa
- **Contiene**:
  - Descripción general
  - Requisitos previos
  - Instrucciones de instalación
  - Endpoints de API documentados
  - Cumplimiento PCI/KYC
  - Solución de problemas
- **Lectura**: Primera, para entender el proyecto

#### `SETUP.md`
- **Propósito**: Guía rápida paso a paso
- **Lectura**: Segunda, para ejecutar por primera vez
- **Público**: Usuarios sin experiencia técnica

#### `TESTING.md`
- **Propósito**: Cómo probar los endpoints
- **Herramientas**: cURL, Postman, Insomnia
- **Casos de prueba**: Flujos completos y validaciones

#### `.gitignore`
- **Propósito**: Archivos a ignorar en Git
- **Contiene**: `node_modules/`, `.env`, `*.db`, logs, IDE files

---

## 📂 FRONTEND - `frontend/`

Interfaz de usuario moderna y responsiva.

### `index.html`
- **Tipo**: HTML5
- **Tamaño**: ~200 líneas
- **Responsabilidades**:
  - Estructura DOM completa
  - Formulario de creación
  - Grid de tarjetas
  - Modal de detalles
  - Sección de logs
- **Tecnología**: HTML5 semántico

### `styles.css`
- **Tipo**: CSS3
- **Tamaño**: ~500 líneas
- **Responsabilidades**:
  - Diseño responsivo (mobile-first)
  - Gradientes y animaciones
  - Design system con variables CSS (colores, sombras, transiciones)
  - Tema moderno (Indigo/Purple)
  - Componentes: botones, tarjetas, modales, logs
- **Breakpoints**: 1200px, 768px, 480px

### `app.js`
- **Tipo**: JavaScript vanilla (sin frameworks)
- **Tamaño**: ~400 líneas
- **Responsabilidades**:
  - Comunicación REST con backend
  - Manejo de eventos en UI
  - Validación de inputs cliente
  - Renderizado dinámico de tarjetas
  - Modal interactivo
  - Sistema de logs en tiempo real
- **API base**: `http://localhost:3000/api`

---

## 📂 BACKEND - `backend/`

Servidor Node.js que maneja lógica de negocio.

### `server.js`
- **Tipo**: Node.js + Express
- **Tamaño**: ~80 líneas
- **Responsabilidades**:
  - Iniciar servidor Express
  - Configurar CORS y middleware
  - Servir archivos estáticos (frontend)
  - Montar rutas
  - Manejo global de errores
  - Logs de inicio
- **Puerto**: 3000 (configurable con `PORT` env)
- **Tiempo de inicio**: ~200ms

### `package.json`
- **Propósito**: Metadatos y dependencias de Node
- **Scripts**:
  - `npm start`: Iniciar servidor
  - `npm run dev`: Modo desarrollo con reinicio automático
- **Dependencias principales**:
  - `express@4.18.2`: Framework web
  - `stripe@14.0.0`: SDK oficial de Stripe
  - `better-sqlite3@9.0.0`: Base de datos
  - `dotenv@16.3.1`: Variables de entorno
  - `cors@2.8.5`: CORS habilitado
  - `body-parser@1.20.2`: Parsing de JSON

### `.env.example`
- **Propósito**: Plantilla de variables de entorno
- **Contiene**:
  - `PORT`: Puerto del servidor
  - `NODE_ENV`: Ambiente (development/production)
  - `PROVIDER`: Proveedor (stripe/adyen/marqeta)
  - `STRIPE_API_KEY`: Clave secreta de Stripe
  - `STRIPE_PUBLIC_KEY`: Clave pública
  - `DB_PATH`: Ruta de BD
  - `LOG_LEVEL`: Nivel de logs
- **Acción**: Copiar a `.env` y completar valores reales

### `.env`
- **Propósito**: Configuración real (local, privado)
- **⚠️  IMPORTANTE**: NO versionado en Git (.gitignore)
- **Contiene**: Valores reales de claves y configuración
- **Creación**: `cp .env.example .env` + editar

### `start.sh`
- **Propósito**: Script de inicio rápido (opcional)
- **Uso**: `./start.sh`
- **Ventajas**: Verificaciones previas, mensajes claros

---

## 📂 ROUTES - `backend/routes/`

Enrutamiento de APIs REST.

### `cards.js`
- **Tipo**: Express router
- **Tamaño**: ~150 líneas
- **Endpoints**:

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/cards` | Crear tarjeta |
| GET | `/api/cards` | Listar tarjetas |
| GET | `/api/cards/:id` | Obtener detalles |
| POST | `/api/cards/:id/freeze` | Congelar |
| POST | `/api/cards/:id/cancel` | Cancelar |

- **Validaciones**:
  - Nombre: min 3 chars, solo letras + espacios
  - ID: verificación de existencia
  - Errores: códigos HTTP correctos (400, 404, 500)
- **Logs**: Cada endpoint loguea entrada y resultado

---

## 📂 SERVICES - `backend/services/`

Lógica de negocio y integración con APIs externas.

### `provider.js`
- **Tipo**: Módulo Node.js
- **Tamaño**: ~350 líneas (el más grande)
- **Responsabilidades**:

#### Stripe Integration:
- Conectar con API oficial de Stripe (sandbox)
- Crear tarjetas virtuales (`/issuing/cards`)
- Gestionar cardholders
- Limites de gasto (daily: $1000 USD)

#### Database (SQLite):
- Crear tabla `virtual_cards` si no existe
- Insertar/actualizar registros
- Consultar tarjetas
- Historial de acciones (JSON)

#### Funciones Principales:
- `createVirtualCard(holderName, currency)`: Crear → Stripe → BD local
- `getAllCards()`: SELECT * FROM BD
- `getCard(cardId)`: Obtener por ID
- `freezeCard(cardId)`: Llamar Stripe + actualizar BD
- `cancelCard(cardId)`: Idem congelar pero con cancel
- `autoCancelExpiredCards()`: Verificación periódica (cada 5 min)

#### PCI DSS Implementation:
- ✅ Nunca almacena número completo (solo últimos 4 dígitos)
- ✅ Nunca almacena CVV
- ✅ Almacena solo metadatos seguros
- ✅ Logs internos sin datos sensibles

---

## 📂 DATA - `backend/data/`

Base de datos local (generada automáticamente).

### `cards.db`
- **Tipo**: SQLite 3
- **Creación**: Automática al iniciar servidor (si no existe)
- **Tabla**: `virtual_cards`

**Esquema**:
```sql
CREATE TABLE virtual_cards (
  id TEXT PRIMARY KEY,                  -- ID único local (TC-xxx)
  stripe_card_id TEXT NOT NULL,         -- ID en Stripe (ics_xxx)
  holder_name TEXT NOT NULL,            -- Nombre del titular
  last_four TEXT NOT NULL,              -- Últimos 4 dígitos (PCI safe)
  brand TEXT NOT NULL,                  -- Visa/Mastercard
  status TEXT DEFAULT 'active',         -- active/frozen/cancelled
  created_at DATETIME DEFAULT NOW(),    -- Timestamp creación
  expires_at DATETIME,                  -- Vencimiento (10 min por defecto)
  auto_cancel BOOLEAN DEFAULT 0,        -- Cancelada automáticamente?
  action_history TEXT                   -- JSON de acciones
);
```

**Ejemplo de fila**:
```
id: TC-1698765432123-ABC123XYZ
stripe_card_id: ics_1A2B3C4D
holder_name: Juan Pérez
last_four: 4242
brand: Visa
status: active
created_at: 2024-10-31 10:30:32
expires_at: 2024-10-31 10:40:32
action_history: [{"action":"created","timestamp":"2024-10-31T10:30:32Z"}]
```

---

## 🔄 Flujo de Datos

### Creación de Tarjeta:

```
Frontend (app.js)
  ↓ POST /api/cards {holderName}
  ↓
Backend (routes/cards.js)
  ↓ validar nombre
  ↓
Backend (services/provider.js)
  ├─ Conectar a Stripe API
  ├─ Crear tarjeta virtual (tipo: 'virtual')
  ├─ Obtener número (solo esa vez)
  ├─ Extraer últimos 4 dígitos
  ├─ Guardar en SQLite local
  └─ Retornar datos seguros (sin número completo)
  ↓
Backend (routes/cards.js)
  ↓ JSON response {success: true, data: {...}}
  ↓
Frontend (app.js)
  ├─ Renderizar tarjeta en grid
  ├─ Log en consola visual
  └─ Actualizar contador
```

### Auto-Cancelación:

```
Backend setInterval(() => {}, 5 min)
  ├─ Query: SELECT tarjetas donde status='active' Y expires_at < NOW
  ├─ Para cada tarjeta expirada:
  │   ├─ Llamar stripe.issuing.cards.update(..., {status: 'canceled'})
  │   ├─ Actualizar BD local (status = 'cancelled')
  │   └─ Log: "Auto-cancelada tarjeta xxx"
  └─ Logs diarios si hay cancelaciones
```

---

## 🔐 Seguridad

### Almacenamiento:
- ❌ Número completo: NUNCA
- ❌ CVV: NUNCA
- ✅ Últimos 4 dígitos: Sí (referencia)
- ✅ Metadatos: Sí (seguro)

### Transmisión:
- HTTPS en producción (requerido)
- HTTP solo en local/desarrollo
- CORS habilitado para frontend en localhost

### Validación:
- Inputs: Min length, caracteres permitidos
- SQL: Consultas parametrizadas (previene inyección)
- API: Códigos de error HTTP correctos

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| Líneas de código | ~1500+ |
| Archivos | 10 (código) + 4 (doc) |
| Funciones | 15+ |
| Dependencias | 110 (npm) |
| Tamaño bundle frontend | ~30 KB |
| Tamaño BD vacía | ~4 KB |

---

## 🚀 Próximas Mejoras (Opcional)

- [ ] Autenticación de usuarios
- [ ] Dashboard con gráficos
- [ ] Export a CSV/Excel
- [ ] Notificaciones por email
- [ ] Rate limiting en API
- [ ] Tests unitarios (Jest)
- [ ] Docker + docker-compose
- [ ] Despliegue a Heroku/AWS
- [ ] Integración con Adyen/Marqeta
- [ ] Mobile app (React Native)

---

**Última actualización**: Octubre 2024
**Versión**: 1.0.0
**Estado**: ✅ Funcional y listo para uso
