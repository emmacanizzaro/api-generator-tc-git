/**
 * SERVICIO DE PROVEEDOR - Integración con APIs de Emisión de Tarjetas
 *
 * Soporta: Stripe Issuing (primary)
 * Modo: Sandbox (para pruebas, NO datos reales)
 *
 * NOTA PCI DSS:
 * - Nunca almacenar número completo de tarjeta
 * - Nunca almacenar CVV
 * - Solo guardar últimos 4 dígitos + metadatos
 *
 * NOTA KYC:
 * - Esta app requiere verificación previa del usuario en Stripe
 * - El proveedor hace validación KYC/AML
 */

const Stripe = require("stripe");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// ============ INICIALIZACIÓN ============

let stripe = null;

/**
 * Detecta si se debe usar modo mock (sin Stripe real)
 * Se activa cuando no hay clave configurada o es el placeholder
 */
function isMockMode() {
  const key = process.env.STRIPE_API_KEY || "";
  return !key || key === "sk_test_YOUR_SECRET_KEY_HERE";
}

function getStripeClient() {
  if (stripe) {
    return stripe;
  }

  if (!process.env.STRIPE_API_KEY) {
    throw new Error("STRIPE_API_KEY no configurada en .env");
  }

  stripe = new Stripe(process.env.STRIPE_API_KEY, {
    apiVersion: "2023-10-16",
    timeout: 30000,
  });

  return stripe;
}

// ============ MOCK MODE ============

const MOCK_BRANDS = ["Visa", "Mastercard"];

function generateMockLastFour() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generateMockCardNumber() {
  // Genera número de 16 dígitos solo para display en mock (no se almacena)
  return Array.from({ length: 4 }, () =>
    String(Math.floor(1000 + Math.random() * 9000)),
  ).join(" ");
}

function createMockCardData(holderName) {
  const brand = MOCK_BRANDS[Math.floor(Math.random() * MOCK_BRANDS.length)];
  const lastFour = generateMockLastFour();
  const cardId = generateCardId();
  const mockStripeId = "mock_card_" + Date.now();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const expMonth = Math.floor(Math.random() * 12) + 1;
  const expYear = new Date().getFullYear() + 3;

  const stmt = db.prepare(`
    INSERT INTO virtual_cards
    (id, stripe_card_id, holder_name, last_four, brand, status, expires_at, exp_month, exp_year, action_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const history = JSON.stringify([
    { action: "created", timestamp: new Date().toISOString(), mode: "mock" },
  ]);

  stmt.run(
    cardId,
    mockStripeId,
    holderName,
    lastFour,
    brand,
    "active",
    expiresAt.toISOString(),
    expMonth,
    expYear,
    history,
  );

  console.log(`[PROVIDER MOCK] ✅ Tarjeta simulada creada: ${cardId}`);

  return {
    id: cardId,
    stripeId: mockStripeId,
    holderName,
    lastFour,
    brand,
    status: "active",
    expMonth,
    expYear,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    mock: true,
    message: `Tarjeta virtual simulada (modo demo). Expirará en 10 minutos.`,
  };
}

// Base de datos SQLite local
const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, "..", process.env.DB_PATH)
  : path.join(__dirname, "../data/cards.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS virtual_cards (
    id TEXT PRIMARY KEY,
    stripe_card_id TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    last_four TEXT NOT NULL,
    brand TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    exp_month INTEGER,
    exp_year INTEGER,
    auto_cancel BOOLEAN DEFAULT 0,
    action_history TEXT
  )
`);

// Asegura compatibilidad con bases previas a la incorporación de estos campos
ensureColumn("exp_month", "INTEGER");
ensureColumn("exp_year", "INTEGER");

// ============ FUNCIONES PRINCIPALES ============

/**
 * Crear una tarjeta virtual en Stripe (sandbox)
 *
 * @param {string} holderName - Nombre del titular
 * @param {string} currency - Moneda (ej: 'usd')
 * @returns {Promise<Object>} Datos de la tarjeta creada
 */
async function createVirtualCard(holderName, currency = "usd") {
  try {
    console.log(`[PROVIDER] Creando tarjeta virtual para: ${holderName}`);

    if (isMockMode()) {
      console.log("[PROVIDER MOCK] Modo demo activo (sin Stripe)");
      return createMockCardData(holderName);
    }

    const stripeClient = getStripeClient();

    // 1. Verificar que hay un cardholder en Stripe
    const cardholders = await stripeClient.issuing.cardholders.list({
      limit: 1,
    });

    if (cardholders.data.length === 0) {
      console.warn(
        "[PROVIDER] ⚠️  No hay cardholders en Stripe. Crear uno primero.",
      );
      throw new Error(
        "No hay cardholder configurado. Cree el siguiente documento:\n" +
          "https://stripe.com/docs/issuing/quickstart#create-cardholder",
      );
    }

    const cardholderId = cardholders.data[0].id;

    // 2. Crear tarjeta virtual en Stripe
    const card = await stripeClient.issuing.cards.create({
      type: "virtual",
      cardholder: cardholderId,
      currency: currency,
      spending_controls: {
        spending_limits: [
          {
            interval: "daily",
            amount: 100000, // $1,000 USD diarios en sandbox
          },
        ],
      },
    });

    console.log(`[PROVIDER] ✅ Tarjeta creada: ${card.id}`);

    // 3. Obtener detalles de la tarjeta (incluyendo número)
    // ⚠️  IMPORTANTE: El número completo se obtiene solo en la creación
    const cardDetails = await stripeClient.issuing.cards.retrieve(card.id);

    // 4. Extraer últimos 4 dígitos (PCI compliance)
    const lastFour =
      cardDetails.last4 || card.last4 || cardDetails.number?.slice(-4);
    if (!lastFour) {
      throw new Error("No se pudo obtener last4 de la tarjeta emitida");
    }

    const brand = cardDetails.brand || card.brand || "Visa"; // Stripe usa Visa por defecto en sandbox
    const expMonth = cardDetails.exp_month || card.exp_month || null;
    const expYear = cardDetails.exp_year || card.exp_year || null;

    // 5. Guardar en BD local (SIN el número completo)
    const cardId = generateCardId();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expira en 10 minutos (configurable)

    const stmt = db.prepare(`
      INSERT INTO virtual_cards
      (id, stripe_card_id, holder_name, last_four, brand, status, expires_at, exp_month, exp_year, action_history)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const history = JSON.stringify([
      { action: "created", timestamp: new Date().toISOString() },
    ]);

    stmt.run(
      cardId,
      card.id,
      holderName,
      lastFour,
      brand,
      "active",
      expiresAt.toISOString(),
      expMonth,
      expYear,
      history,
    );

    console.log(`[PROVIDER] Tarjeta guardada localmente: ${cardId}`);

    return {
      id: cardId,
      stripeId: card.id,
      holderName: holderName,
      lastFour: lastFour,
      brand: brand,
      status: "active",
      expMonth,
      expYear,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      message: `Tarjeta virtual emitida. Expirará en 10 minutos (modo sandbox).`,
    };
  } catch (error) {
    console.error("[PROVIDER ERROR]", error.message);
    throw new Error(`No se pudo crear tarjeta: ${error.message}`);
  }
}

/**
 * Listar todas las tarjetas del usuario
 *
 * @returns {Array} Lista de tarjetas
 */
function getAllCards() {
  try {
    const stmt = db.prepare(`
          SELECT id, holder_name as holderName, last_four as lastFour,
            brand, status, created_at as createdAt, expires_at as expiresAt,
            exp_month as expMonth, exp_year as expYear
      FROM virtual_cards
      ORDER BY created_at DESC
    `);

    const cards = stmt.all();
    console.log(`[PROVIDER] Consultadas ${cards.length} tarjetas`);

    return cards;
  } catch (error) {
    console.error("[PROVIDER ERROR]", error.message);
    throw error;
  }
}

/**
 * Obtener detalles de una tarjeta
 *
 * @param {string} cardId - ID local de la tarjeta
 * @returns {Object} Datos de la tarjeta
 */
function getCard(cardId) {
  try {
    const stmt = db.prepare("SELECT * FROM virtual_cards WHERE id = ?");
    const card = stmt.get(cardId);

    if (!card) {
      throw new Error(`Tarjeta no encontrada: ${cardId}`);
    }

    return {
      id: card.id,
      stripeId: card.stripe_card_id,
      holderName: card.holder_name,
      lastFour: card.last_four,
      brand: card.brand,
      status: card.status,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      createdAt: card.created_at,
      expiresAt: card.expires_at,
      actionHistory: JSON.parse(card.action_history || "[]"),
    };
  } catch (error) {
    console.error("[PROVIDER ERROR]", error.message);
    throw error;
  }
}

/**
 * Revelar datos sensibles de tarjeta (solo lectura puntual, no persistente)
 *
 * @param {string} cardId - ID local de la tarjeta
 * @returns {Promise<Object>} Número y CVC de Stripe
 */
async function revealCardSensitiveData(cardId) {
  try {
    const card = getCard(cardId);
    const isMockCard = card.stripeId.startsWith("mock_card_");

    if (isMockMode() || isMockCard) {
      throw new Error(
        "Datos sensibles no disponibles en modo mock. Cree una tarjeta real de Stripe.",
      );
    }

    const stripeClient = getStripeClient();
    const stripeCard = await stripeClient.issuing.cards.retrieve(
      card.stripeId,
      {
        expand: ["number", "cvc"],
      },
    );

    if (!stripeCard.number || !stripeCard.cvc) {
      throw new Error(
        "Stripe no devolvió número/CVC. Verifique permisos de Issuing para la API key.",
      );
    }

    return {
      number: stripeCard.number,
      cvc: stripeCard.cvc,
      expMonth: stripeCard.exp_month,
      expYear: stripeCard.exp_year,
      brand: stripeCard.brand,
      revealedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[PROVIDER ERROR]", error.message);
    throw error;
  }
}

/**
 * Congelar una tarjeta virtual
 *
 * @param {string} cardId - ID local de la tarjeta
 * @returns {Object} Confirmación
 */
async function freezeCard(cardId) {
  try {
    const card = getCard(cardId);
    const isMockCard = card.stripeId.startsWith("mock_card_");

    if (card.status === "frozen") {
      return { message: "Tarjeta ya está congelada" };
    }

    if (!isMockMode() && !isMockCard) {
      const stripeClient = getStripeClient();
      await stripeClient.issuing.cards.update(card.stripeId, {
        status: "inactive",
      });
    } else {
      console.log(`[PROVIDER MOCK] Congelando tarjeta localmente: ${cardId}`);
    }

    updateCardStatus(cardId, "frozen");
    addToHistory(cardId, "frozen");

    console.log(`[PROVIDER] ✅ Tarjeta congelada: ${cardId}`);

    return { message: "Tarjeta congelada exitosamente" };
  } catch (error) {
    console.error("[PROVIDER ERROR]", error.message);
    throw error;
  }
}

/**
 * Cancelar una tarjeta virtual
 *
 * @param {string} cardId - ID local de la tarjeta
 * @returns {Object} Confirmación
 */
async function cancelCard(cardId) {
  try {
    const card = getCard(cardId);
    const isMockCard = card.stripeId.startsWith("mock_card_");

    if (card.status === "cancelled") {
      return { message: "Tarjeta ya está cancelada" };
    }

    if (!isMockMode() && !isMockCard) {
      const stripeClient = getStripeClient();
      await stripeClient.issuing.cards.update(card.stripeId, {
        status: "canceled",
      });
    } else {
      console.log(`[PROVIDER MOCK] Cancelando tarjeta localmente: ${cardId}`);
    }

    updateCardStatus(cardId, "cancelled");
    addToHistory(cardId, "cancelled");

    console.log(`[PROVIDER] ✅ Tarjeta cancelada: ${cardId}`);

    return { message: "Tarjeta cancelada exitosamente" };
  } catch (error) {
    console.error("[PROVIDER ERROR]", error.message);
    throw error;
  }
}

/**
 * Auto-cancelar tarjetas expiradas (verificar cada tarjeta)
 */
async function autoCancelExpiredCards() {
  try {
    const stmt = db.prepare(`
      SELECT id FROM virtual_cards
      WHERE status = 'active' AND datetime(expires_at) < datetime('now')
    `);

    const expiredCards = stmt.all();

    for (const card of expiredCards) {
      await cancelCard(card.id);
      console.log(`[PROVIDER] Auto-cancelada tarjeta expirada: ${card.id}`);
    }

    if (expiredCards.length > 0) {
      console.log(
        `[PROVIDER] ${expiredCards.length} tarjeta(s) auto-cancelada(s)`,
      );
    }
  } catch (error) {
    console.error("[PROVIDER ERROR]", error.message);
  }
}

// ============ FUNCIONES AUXILIARES ============

function generateCardId() {
  return (
    "TC-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 9).toUpperCase()
  );
}

function ensureColumn(columnName, columnType) {
  const columns = db.prepare("PRAGMA table_info(virtual_cards)").all();
  const hasColumn = columns.some((c) => c.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE virtual_cards ADD COLUMN ${columnName} ${columnType}`);
  }
}

function updateCardStatus(cardId, status) {
  const stmt = db.prepare("UPDATE virtual_cards SET status = ? WHERE id = ?");
  stmt.run(status, cardId);
}

function addToHistory(cardId, action) {
  const card = db
    .prepare("SELECT action_history FROM virtual_cards WHERE id = ?")
    .get(cardId);
  let history = JSON.parse(card.action_history || "[]");

  history.push({
    action: action,
    timestamp: new Date().toISOString(),
  });

  const stmt = db.prepare(
    "UPDATE virtual_cards SET action_history = ? WHERE id = ?",
  );
  stmt.run(JSON.stringify(history), cardId);
}

// ============ EJECUTAR VERIFICACIÓN PERIÓDICA ============
// Cada 5 minutos, verificar tarjetas expiradas
setInterval(autoCancelExpiredCards, 5 * 60 * 1000);

// ============ EXPORTAR ============
module.exports = {
  createVirtualCard,
  getAllCards,
  getCard,
  revealCardSensitiveData,
  freezeCard,
  cancelCard,
  autoCancelExpiredCards,
};
