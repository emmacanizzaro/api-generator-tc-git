/**
 * RUTAS API - Endpoints para gestionar tarjetas virtuales
 */

const express = require("express");
const router = express.Router();
const provider = require("../services/provider");
const { requireAuth, requireRole } = require("../middleware/auth");

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
  return next();
};

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateHolderName,
  async (req, res) => {
    try {
      const { holderName, currency = "usd" } = req.body;
      const card = await provider.createVirtualCard(holderName, currency);

      return res.status(201).json({
        success: true,
        data: card,
        message: "Tarjeta virtual creada exitosamente en sandbox",
      });
    } catch (error) {
      const statusCode = error.message.includes("STRIPE_API_KEY") ? 503 : 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
        hint: "Verifica que Stripe está configurado correctamente y tienes un cardholder registrado",
      });
    }
  },
);

router.get("/", requireAuth, (req, res) => {
  try {
    const cards = provider.getAllCards();
    return res.json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/metrics", requireAuth, (req, res) => {
  try {
    const metrics = provider.getDashboardMetrics();
    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const card = provider.getCard(id);

    return res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post(
  "/:id/reveal",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          error: "Revelado de datos sensibles deshabilitado en producción",
        });
      }

      const sensitiveData = await provider.revealCardSensitiveData(id);

      return res.json({
        success: true,
        data: sensitiveData,
        warning: "Datos sensibles: no almacenar ni compartir.",
      });
    } catch (error) {
      if (error.message.includes("no encontrada")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

router.post(
  "/:id/freeze",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await provider.freezeCard(id);

      return res.json({
        success: true,
        message: result.message,
        cardId: id,
      });
    } catch (error) {
      if (error.message.includes("no encontrada")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

router.post(
  "/:id/cancel",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await provider.cancelCard(id);

      return res.json({
        success: true,
        message: result.message,
        cardId: id,
      });
    } catch (error) {
      if (error.message.includes("no encontrada")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

module.exports = router;
