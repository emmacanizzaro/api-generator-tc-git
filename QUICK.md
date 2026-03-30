# ⚡ QUICK REFERENCE

Referencia rápida para usuarios frecuentes.

## 🚀 START (en macOS)

### Terminal 1: Iniciar Servidor

```bash
# Navegar a proyecto
cd ~/Desktop/'Proyectos de Apps'/'API Generador de TC'/backend

# Asegurarse de tener .env con STRIPE_API_KEY
# (si no lo tienes: cp .env.example .env)

# Iniciar
npm start

# Resultado esperado:
# ╔════════════════════════════════════════════════════════╗
# ║  SERVIDOR: API Generador de Tarjetas Virtuales        ║
# ║  Puerto: 3000                                          ║
# ║  ...
# ╚════════════════════════════════════════════════════════╝
```

### Terminal 2: Abrir App

```bash
# Navegador
http://localhost:3000

# O desde Terminal
open http://localhost:3000
```

---

## 🧪 QUICK TEST (cURL)

```bash
# ✅ Salud
curl http://localhost:3000/api/health

# ✅ Listar (vacío al inicio)
curl http://localhost:3000/api/cards

# ✅ Crear
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{"holderName": "Test User"}'

# ✅ Listar de nuevo
curl http://localhost:3000/api/cards

# Copiar ID de la tarjeta y reemplazar {id}:

# ✅ Detalles
curl http://localhost:3000/api/cards/{id}

# ✅ Congelar
curl -X POST http://localhost:3000/api/cards/{id}/freeze

# ✅ Cancelar (⚠️ irreversible)
curl -X POST http://localhost:3000/api/cards/{id}/cancel
```

---

## 🛠️ CONFIGURACIÓN (Paso Único)

### 1. Stripe API Key

En `backend/.env`:
```
STRIPE_API_KEY=sk_test_YOUR_KEY_HERE
```

Obtener de: https://dashboard.stripe.com/apikeys (modo TEST)

### 2. Cardholder en Stripe

Una sola vez: https://dashboard.stripe.com/test/issuing/cardholders
→ Create cardholder → Rellenar form

---

## 📂 ARCHIVOS CLAVE

| Archivo | Propósito | Editar? |
|---------|-----------|---------|
| `backend/server.js` | Servidor principal | Raro |
| `backend/services/provider.js` | Lógica Stripe + BD | Extender, no cambiar core |
| `backend/routes/cards.js` | Endpoints | Solo agregar nuevos |
| `frontend/app.js` | Lógica cliente | Frecuente |
| `frontend/styles.css` | Diseño | Frecuente |
| `backend/.env` | **Tu configuración** | **Siempre** |

---

## 🔧 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| ❌ "STRIPE_API_KEY no existe" | `cp .env.example .env` → editar |
| ❌ "Puerto 3000 en uso" | `lsof -i:3000` → `kill -9 {PID}` |
| ❌ "No hay cardholder" | Crear en Stripe Dashboard |
| ❌ npm error | `rm -rf node_modules` → `npm install` |
| ❌ Tarjetas no aparecen | DevTools (F12) → Console → ver error |

---

## 📋 ENDPOINTS CHEATSHEET

```
POST   /api/cards                   ← Crear
GET    /api/cards                   ← Listar
GET    /api/cards/:id               ← Detalles
POST   /api/cards/:id/freeze        ← Congelar
POST   /api/cards/:id/cancel        ← Cancelar
GET    /api/health                  ← Salud servidor
```

---

## 💾 GUARDAR CÓDIGO

```bash
# Ver cambios
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: nueva característica"

# Push
git push origin main
```

---

## 🎯 FLUJO TÍPICO

1. ✅ Terminal: `npm start` en `backend/`
2. ✅ Navegador: `http://localhost:3000`
3. ✅ Escribir nombre en formulario
4. ✅ Click "Crear Tarjeta"
5. ✅ Ver en lista
6. ✅ Click en tarjeta
7. ✅ Ver detalles, congelar o cancelar
8. ✅ Revisar logs abajo
9. ⏹️ Ctrl+C en terminal para detener

---

## 📚 DOCUMENTACIÓN

| Archivo | Contenido |
|---------|-----------|
| `README.md` | **Leer PRIMERO** - Completa |
| `SETUP.md` | Paso a paso para iniciadores |
| `STRUCTURE.md` | Archivos y estructura |
| `TESTING.md` | Cómo probar endpoints |
| `QUICK.md` | Este archivo |

---

## 🔗 LINKS IMPORTANTES

- 🌐 Stripe Dashboard: https://dashboard.stripe.com
- 📖 Stripe Docs: https://stripe.com/docs/issuing
- 💻 Node.js: https://nodejs.org
- 📝 Express: https://expressjs.com
- 🗄️ SQLite: https://www.sqlite.org

---

## 💡 TIPS

✨ Editar tiempo de expiración (ahora 10 min):
→ File: `backend/services/provider.js` línea ~145

✨ Cambiar puerto (ahora 3000):
→ `PORT=3001 npm start`

✨ Ver BD directamente:
→ `sqlite3 backend/data/cards.db ".tables"`

✨ Logs del servidor en tiempo real:
→ Ver Terminal donde corre `npm start`

---

**Keep shipping! 🚀**
