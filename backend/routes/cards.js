/**
 * RUTAS API - Endpoints para gestionar tarjetas virtuales
 *
 * POST   /api/cards              - Crear tarjeta virtual
 * GET    /api/cards              - Listar todas las tarjetas
 * GET    /api/cards/:id          - Obtener detalles de una tarjeta
 * POST   /api/cards/:id/reveal    - Revelar PAN/CVC (solo desarrollo)
 * POST   /api/cards/:id/freeze   - Congelar tarjeta
 * POST   /api/cards/:id/cancel   - Cancelar tarjeta
 */

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const provider = require("../services/provider");

const basicAuthUser = process.env.BASIC_AUTH_USER || "";
const basicAuthPass = process.env.BASIC_AUTH_PASS || "";
let authWarningShown = false;

function secureCompare(a, b) {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

function requireBasicAuth(req, res, next) {
  const missingCredentials = !basicAuthUser || !basicAuthPass;

  if (missingCredentials) {
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        success: false,
        error:
          "Autenticación básica no configurada. Defina BASIC_AUTH_USER y BASIC_AUTH_PASS.",
      });
    }

    if (!authWarningShown) {
      console.warn(
        "[AUTH] BASIC_AUTH_USER/BASIC_AUTH_PASS no definidos. Acceso abierto en desarrollo.",
      );
      authWarningShown = true;
    }

    return next();
  }

  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Tarjetas API"');
    return res.status(401).json({
      success: false,
      error: "Credenciales requeridas",
    });
  }

  const token = authHeader.slice(6);
  let decoded = "";

  try {
    decoded = Buffer.from(token, "base64").toString("utf8");
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Authorization inválido",
    });
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return res.status(401).json({
      success: false,
      error: "Formato de credenciales inválido",
    });
  }

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (
    !secureCompare(user, basicAuthUser) ||
    !secureCompare(pass, basicAuthPass)
  ) {
    return res.status(401).json({
      success: false,
      error: "Usuario o contraseña inválidos",
    });
  }

  return next();
}

// ============ VALIDACIÓN DE INPUTS ============

/**
 * Middleware para validar que el nombre del titular es válido
 */
const validateHolderName = (req, res, next) => {
  const holderName =
    typeof req.body.holderName === "string" ? req.body.holderName.trim() : "";

  if (!holderName || holderName.length < 3) {
    return res.status(400).json({
      error: "El nombre del titular debe tener al menos 3 caracteres",
    });
  }

  if (!/^[\p{L}\p{M}\s'-]+$/u.test(holderName)) {
    return res.status(400).json({
      error:
        "El nombre solo puede contener letras, espacios, apóstrofes y guiones",
    });
  }

  req.body.holderName = holderName;

  next();
};

// ============ ENDPOINTS ============

/**
 * POST /api/cards
 * Crear una nueva tarjeta virtual
 *
 * Body:
 * {
 *   "holderName": "Juan Pérez",
 *   "currency": "usd"  (opcional)
 * }
 */
router.post("/", requireBasicAuth, validateHolderName, async (req, res) => {
  try {
    const { holderName, currency = "usd" } = req.body;

    console.log(
      `\n📝 [POST /api/cards] Solicitud nueva tarjeta para: ${holderName}`,
    );

    const card = await provider.createVirtualCard(holderName, currency);

    res.status(201).json({
      success: true,
      data: card,
      message: "Tarjeta virtual creada exitosamente en sandbox",
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error.message);

    const statusCode = error.message.includes("STRIPE_API_KEY") ? 503 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      hint: "Verifica que Stripe está configurado correctamente y tienes un cardholder registrado",
    });
  }
});

/**
 * GET /api/cards
 * Listar todas las tarjetas virtuales
 */
router.get("/", (req, res) => {
  try {
    console.log(`\n📋 [GET /api/cards] Listando tarjetas`);

    const cards = provider.getAllCards();

    res.json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cards/metrics
 * Obtener métricas para dashboard
 */
router.get("/metrics", (req, res) => {
  try {
    const metrics = provider.getDashboardMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cards/:id
 * Obtener detalles de una tarjeta específica
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🔍 [GET /api/cards/:id] Consultando tarjeta: ${id}`);

    const card = provider.getCard(id);

    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error.message);

    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cards/:id/reveal
 * Revelar número completo y CVC de una tarjeta virtual (uso puntual)
 */
router.post("/:id/reveal", requireBasicAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Revelado de datos sensibles deshabilitado en producción",
      });
    }

    console.log(
      `\n👁️  [POST /api/cards/:id/reveal] Revelando datos para: ${id}`,
    );

    const sensitiveData = await provider.revealCardSensitiveData(id);

    res.json({
      success: true,
      data: sensitiveData,
      warning: "Datos sensibles: no almacenar ni compartir.",
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error.message);

    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cards/:id/freeze
 * Congelar una tarjeta virtual
 */
router.post("/:id/freeze", requireBasicAuth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n❄️  [POST /api/cards/:id/freeze] Congelando tarjeta: ${id}`);

    const result = await provider.freezeCard(id);

    res.json({
      success: true,
      message: result.message,
      cardId: id,
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error.message);

    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cards/:id/cancel
 * Cancelar una tarjeta virtual
 */
router.post("/:id/cancel", requireBasicAuth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🗑️  [POST /api/cards/:id/cancel] Cancelando tarjeta: ${id}`);

    const result = await provider.cancelCard(id);

    res.json({
      success: true,
      message: result.message,
      cardId: id,
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error.message);

    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============ EXPORTAR ============
module.exports = router;
