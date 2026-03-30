# 🚀 GUÍA RÁPIDA DE INICIO

Esta guía te llevará paso a paso para tener la aplicación funcionando en **menos de 15 minutos**.

## ⏱️ Tiempo estimado: 10-15 minutos

## ✅ Pre-requisitos (verificar antes)

### 1. ¿Tienes Node.js instalado?

Abre Terminal y ejecuta:
```bash
node --version
```

Si ves algo como `v18.17.0` o superior, ✅ está bien.

**Si NO tienes Node.js**:
- Descargar de: https://nodejs.org/
- Instalar la versión LTS (Long Term Support)
- Reiniciar Terminal después de instalar

### 2. ¿Tienes cuenta en Stripe?

Si NO:
1. Ir a: https://stripe.com
2. Click en **"Sign up"**
3. Completar registro (gratis)
4. ✅ Listo

## 🎯 Paso a Paso

### Paso 1️⃣: Abrir Terminal en el Proyecto

```bash
# En macOS con Finder:
# Abrir Finder → Ir a: Desktop/Proyectos de Apps/API Generador de TC
# Click derecho → Servicios → Nueva Terminal en la carpeta

# O desde Terminal:
cd ~/Desktop/'Proyectos de Apps'/'API Generador de TC'
```

**Resultado esperado**: Terminal muestra ruta que termina en `API Generador de TC`

---

### Paso 2️⃣: Instalar Dependencias

```bash
cd backend
npm install
```

**¿Qué pasa?**
- Se descarga e instala automáticamente:
  - Express (servidor web)
  - Stripe (SDK oficial)
  - SQLite (base de datos)
  - Otros paquetes necesarios
- Tarda 2-5 minutos
- Genera carpeta `node_modules/` (150+ MB, normal)

**Resultado esperado**: Termina sin errores rojos. Muestra: `added XX packages`

---

### Paso 3️⃣: Configurar Stripe

#### 3.1️⃣ Obtener tus claves API

1. Ir a: https://dashboard.stripe.com/apikeys
2. **Verificar que estés en MODO TEST** (switch en superior izquierdo debe mostrar "Viewing test data")
3. Copiar **Secret Key** (comienza con `sk_test_...`)
   - Click en icono de copiar
   - Guardar en Notepad temporal

#### 3.2️⃣ Crear archivo `.env`

En Terminal (debe estar en carpeta `backend/`):

```bash
cp .env.example .env
```

Esto crea un archivo `.env` listo para editar.

#### 3.3️⃣ Editar `.env` con tu clave

Opciones:

**A) Desde Terminal (nano editor)**:
```bash
nano .env
```
- Encontrar línea: `STRIPE_API_KEY=sk_test_YOUR_SECRET_KEY_HERE`
- Reemplazar `sk_test_YOUR_SECRET_KEY_HERE` con tu clave real (copiar y pegar)
- Presionar: `Ctrl+X` → `Y` → `Enter`

**B) Desde Editor de Texto**:
- Abrir archivo: `backend/.env`
- Buscar: `STRIPE_API_KEY=sk_test_YOUR_SECRET_KEY_HERE`
- Reemplazar con tu clave (copiar de Stripe Dashboard)
- Guardar: `Cmd+S`

**Resultado esperado**: `.env` contiene tu clave secreta real

---

### Paso 4️⃣: Crear Cardholder en Stripe

Una sola vez. Sin esto, no puedes crear tarjetas.

1. Ir a: https://dashboard.stripe.com/test/issuing/cardholders
2. Click botón azul: **"Create cardholder"**
3. Rellenar:
   - **Name**: `Test User`
   - **Email**: `test@example.com`
4. Scroll down
5. Rellenar datos de identidad (puede ser dummy en test):
   - Date of Birth: `01/01/1990`
   - Country: `United States`
   - City: `San Francisco`
   - Address: `123 Main St`
   - State: `CA`
   - Postal Code: `94102`
6. Click azul **"Create"**

**Resultado esperado**: Ves mensaje "Cardholder created" ✅

---

### Paso 5️⃣: Iniciar el Servidor

En Terminal (carpeta `backend/`):

```bash
npm start
```

**¿Qué pasa?**
- Node.js inicia el servidor Express
- Se crea base de datos local
- Servidor escucha en puerto 3000

**Resultado esperado**: Ves esto:
```
╔════════════════════════════════════════════════════════╗
║  SERVIDOR: API Generador de Tarjetas Virtuales        ║
║  Puerto: 3000                                          ║
║  Ambiente: development                                 ║
║  Proveedor: stripe                                     ║
╚════════════════════════════════════════════════════════╝
```

---

### Paso 6️⃣: Acceder a la App

1. Abrir navegador (Chrome, Safari, Firefox, Edge)
2. Ir a: **http://localhost:3000**
3. Deberías ver:
   - Encabezado: "💳 Generador de Tarjetas Virtuales"
   - Formulario: "Crear Nueva Tarjeta Virtual"
   - Lista vacía de tarjetas
   - Sección de logs abajo

**✅ ¡La app está lista!**

---

## 💡 Ahora Prueba

### Crear tu primera tarjeta:

1. En campo "Nombre del Titular", escribe: `Juan Pérez`
2. Click botón: **"➕ Crear Tarjeta"**
3. Espera 2-3 segundos
4. ✅ Tarjeta aparece en lista con:
   - Últimos 4 dígitos
   - Marca (Visa)
   - Estado: Activa
   - Fecha de creación

### Ver detalles:
- Click en la tarjeta o en "Ver Detalles"
- Se abre ventana con información completa

### Congelar:
- Click en "❄️  Congelar"
- Estado cambia a "Congelada"

### Cancelar:
- Click en "🗑️  Cancelar"
- ⚠️  NO se puede revertir
- Estado cambia a "Cancelada"

---

## ⏹️ Detener la App

En Terminal donde corre el servidor:
- Presionar: `Ctrl+C`
- Esperar a que se detenga (verás prompt volviendo)

---

## 🔄 Ejecutar de Nuevo

```bash
cd ~/Desktop/'Proyectos de Apps'/'API Generador de TC'/backend
npm start
```

---

## 🐛 Si Algo No Funciona

### ❌ "STRIPE_API_KEY no configurada"
→ Verificar que `.env` contiene tu clave

### ❌ "No hay cardholder en Stripe"
→ Seguir Paso 4️⃣ (crear cardholder primero)

### ❌ "No se puede conectar al servidor"
→ Verificar que Terminal muestra `Puerto: 3000`
→ Intentar: http://localhost:3000 en navegador

### ❌ Tarjetas no aparecen
→ Abrir DevTools (F12) → Consola
→ Ver mensaje de error específico
→ Verificar que servidor está corriendo

---

## 📚 Próximos Pasos

Una vez funcionando:
- Leer [README.md](README.md) para documentación completa
- Explorar código en `backend/services/provider.js` para ver integración Stripe
- Modificar tiempo de expiración (ahora 10 minutos)
- Integrar más funcionalidades

---

## 🎓 Aprendizaje

Código incluye:
- **PCI DSS**: Nunca almacena número completo
- **KYC/AML**: Integración oficial con Stripe
- **REST API**: Estructura RESTful clara
- **Frontend moderno**: CSS3, JavaScript vanilla
- **Manejo de errores**: Validación y logs claros

---

**¿Preguntas?** Ver [README.md](README.md#solución-de-problemas)

**¡A programar! 🚀**
