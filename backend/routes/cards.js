/**
 * RUTAS API - Endpoints para gestionar tarjetas virtuales
 *
 * POST   /api/cards              - Crear tarjeta virtual
 * GET    /api/cards              - Listar todas las tarjetas
 * GET    /api/cards/:id          - Obtener detalles de una tarjeta
 * POST   /api/cards/:id/freeze   - Congelar tarjeta
 * POST   /api/cards/:id/cancel   - Cancelar tarjeta
 */

const express = require("express");
const router = express.Router();
const provider = require("../services/provider");

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
router.post("/", validateHolderName, async (req, res) => {
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
 * POST /api/cards/:id/freeze
 * Congelar una tarjeta virtual
 */
router.post("/:id/freeze", async (req, res) => {
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
router.post("/:id/cancel", async (req, res) => {
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
