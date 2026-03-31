/**
 * LÓGICA FRONTEND - Generador de Tarjetas Virtuales
 *
 * Responsabilidades:
 * - Comunicación con API REST (/api/cards)
 * - Manejo de UI/UX
 * - Validación de inputs
 * - Actualización dinámica de tarjetas
 * - Logs en consola visual
 */

const API_BASE = "/api";
const TOKEN_STORAGE_KEY = "tc_api_token";
const USER_STORAGE_KEY = "tc_api_user";
let currentCardId = null; // Para acciones en modal
let currentCardStripeId = null;
let allCards = [];
let activeFilter = "all";
let sensitiveDataTimeout = null;
let apiToken = "";
let currentUser = null;

// ============ INICIALIZACIÓN ============

document.addEventListener("DOMContentLoaded", () => {
  restoreApiCredentials();
  updateAuthStatus();

  addLog("Sistema iniciado. Conectando a servidor...", "info");

  // Cargar tarjetas al iniciar
  setTimeout(() => {
    checkHealthAndLoadCards();
  }, 500);

  // Evento del formulario
  document
    .getElementById("createCardForm")
    .addEventListener("submit", handleCreateCard);

  document
    .getElementById("statusFilter")
    .addEventListener("change", (event) => {
      activeFilter = event.target.value;
      renderFilteredCards();
    });
});

// ============ VERIFICACIÓN DE SALUD ============

async function checkHealthAndLoadCards() {
  try {
    const response = await fetch(`${API_BASE}/health`);

    if (response.ok) {
      addLog("✅ Conectado al servidor", "success");
      refreshCards();
      refreshMetrics();
    }
  } catch (error) {
    addLog(
      "❌ No se puede conectar al servidor. Verifica que está corriendo en puerto 3000.",
      "error",
    );
  }
}

// ============ CREAR TARJETA ============

async function handleCreateCard(event) {
  event.preventDefault();

  const holderName = document.getElementById("holderName").value.trim();
  const messageDiv = document.getElementById("formMessage");

  // Validación
  if (!holderName || holderName.length < 3) {
    showMessage(
      messageDiv,
      "El nombre debe tener al menos 3 caracteres",
      "error",
    );
    return;
  }

  // Deshabilitar botón
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "⏳ Procesando...";

  addLog(`📝 Solicitando tarjeta para: ${holderName}`, "info");

  try {
    if (!apiToken) {
      showMessage(messageDiv, "⚠️ Iniciá sesión primero", "error");
      addLog("⚠️ Falta sesión para crear tarjeta", "warning");
      return;
    }

    if (!isAdmin()) {
      showMessage(messageDiv, "❌ Tu rol no permite crear tarjetas", "error");
      addLog("❌ Operación denegada por rol", "error");
      return;
    }

    const response = await fetch(`${API_BASE}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ holderName }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showMessage(messageDiv, "✅ Tarjeta creada exitosamente", "success");
      addLog(`✅ Tarjeta creada: ${data.data.lastFour}`, "success");

      // Limpiar formulario
      document.getElementById("createCardForm").reset();

      // Recargar lista
      setTimeout(() => {
        refreshCards();
      }, 500);
    } else {
      showMessage(messageDiv, `❌ Error: ${data.error}`, "error");
      addLog(`❌ Error al crear: ${data.error}`, "error");
    }
  } catch (error) {
    showMessage(messageDiv, `❌ Error: ${error.message}`, "error");
    addLog(`❌ Error de conexión: ${error.message}`, "error");
  } finally {
    // Restaurar botón
    submitBtn.disabled = false;
    submitBtn.innerHTML = "➕ Crear Tarjeta";
  }
}

// ============ CARGAR Y MOSTRAR TARJETAS ============

async function refreshCards() {
  try {
    addLog("🔄 Actualizando lista de tarjetas...", "info");

    const response = await fetch(`${API_BASE}/cards`);
    const data = await response.json();

    if (response.ok && data.success) {
      allCards = data.data;
      renderFilteredCards();
      addLog(`✅ ${data.count} tarjeta(s) cargada(s)`, "success");
    } else {
      addLog("❌ Error al cargar tarjetas", "error");
    }
  } catch (error) {
    addLog(`❌ Error: ${error.message}`, "error");
  }
}

function renderFilteredCards() {
  const cards =
    activeFilter === "all"
      ? allCards
      : allCards.filter((card) => card.status === activeFilter);

  renderCards(cards);
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

async function refreshMetrics() {
  try {
    const response = await fetch(`${API_BASE}/cards/metrics`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      addLog("❌ No se pudieron cargar métricas", "error");
      return;
    }

    renderMetrics(data.data);
  } catch (error) {
    addLog(`❌ Error al cargar métricas: ${error.message}`, "error");
  }
}

function renderMetrics(metrics) {
  document.getElementById("metricTotal").textContent = metrics.total ?? 0;
  document.getElementById("metricActive").textContent = metrics.active ?? 0;
  document.getElementById("metricFrozen").textContent = metrics.frozen ?? 0;
  document.getElementById("metricCancelled").textContent =
    metrics.cancelled ?? 0;
  document.getElementById("metricExpiringSoon").textContent =
    metrics.expiringSoon ?? 0;
}

function renderCards(cards) {
  const cardsList = document.getElementById("cardsList");
  const noCards = document.getElementById("noCards");
  const cardCount = document.getElementById("cardCount");

  cardCount.textContent = cards.length;

  if (cards.length === 0) {
    cardsList.innerHTML = "";
    noCards.style.display = "block";
    return;
  }

  noCards.style.display = "none";
  cardsList.innerHTML = cards.map((card) => createCardElement(card)).join("");

  // Agregar event listeners
  cards.forEach((card) => {
    const cardEl = document.querySelector(`[data-card-id="${card.id}"]`);
    if (cardEl) {
      cardEl.addEventListener("click", () => openCardModalById(card.id));
    }
  });
}

function createCardElement(card) {
  const statusClass = `status-${card.status}`;
  const brandEmoji = card.brand === "Mastercard" ? "🟠" : "🔵";

  return `
    <div class="card" data-card-id="${card.id}">
      <div class="card-logo">${brandEmoji} ${card.brand}</div>
      <div class="card-number">•••• •••• •••• ${card.lastFour}</div>
      <div class="card-holder">Titular: ${card.holderName}</div>
      <div class="card-footer">
        <span class="card-status ${statusClass}">${translateStatus(card.status)}</span>
        <span>${formatDate(card.createdAt)}</span>
      </div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="event.stopPropagation(); openCardModalById('${card.id}')">
          Ver Detalles
        </button>
      </div>
    </div>
  `;
}

// ============ MODAL DE TARJETA ============

async function openCardModalById(cardId) {
  try {
    addLog(`🔍 Cargando detalles de tarjeta ${cardId}...`, "info");

    const response = await fetch(`${API_BASE}/cards/${cardId}`);
    const data = await response.json();

    if (response.ok && data.success) {
      openCardModal(data.data);
      return;
    }

    addLog(
      `❌ No se pudo cargar detalle: ${data.error || "Error desconocido"}`,
      "error",
    );
  } catch (error) {
    addLog(`❌ Error cargando detalle: ${error.message}`, "error");
  }
}

function openCardModal(card) {
  currentCardId = card.id;
  currentCardStripeId = card.stripeId || null;
  const modal = document.getElementById("cardModal");
  const modalBody = document.getElementById("modalBody");

  const expiresAt = new Date(card.expiresAt);
  const isExpired = expiresAt < new Date();

  modalBody.innerHTML = `
    <div class="modal-detail">
      <strong>ID:</strong> <span>${card.id}</span>
    </div>
    <div class="modal-detail">
      <strong>Titular:</strong> <span>${card.holderName}</span>
    </div>
    <div class="modal-detail">
      <strong>Tarjeta:</strong> <span>${card.brand} •••• ${card.lastFour}</span>
    </div>
    <div class="modal-detail">
      <strong>Vencimiento tarjeta:</strong> <span>${formatCardExpiry(card.expMonth, card.expYear)}</span>
    </div>
    <div class="modal-detail">
      <strong>ID Stripe:</strong> <span>${card.stripeId || "N/D"}</span>
    </div>
    <div class="modal-detail">
      <strong>Estado:</strong> <span>${translateStatus(card.status)}</span>
    </div>
    <div class="modal-detail">
      <strong>Creada:</strong> <span>${formatDate(card.createdAt)}</span>
    </div>
    <div class="modal-detail">
      <strong>Expira:</strong> <span>${formatDate(card.expiresAt)} ${isExpired ? "(⏰ Vencida)" : ""}</span>
    </div>
    <div id="sensitiveDataContainer" class="sensitive-data" style="display:none;"></div>
    ${
      card.actionHistory && card.actionHistory.length > 0
        ? `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
      <strong>Historial de Acciones:</strong>
      <ul style="margin-top: 10px; padding-left: 20px;">
        ${card.actionHistory
          .map(
            (h) => `
          <li>${translateAction(h.action)} - ${formatDate(h.timestamp)}</li>
        `,
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }
  `;

  modal.style.display = "block";

  const revealBtn = document.getElementById("revealSensitiveBtn");
  const freezeBtn = document.getElementById("freezeBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const admin = isAdmin();

  if (revealBtn) revealBtn.disabled = !admin;
  if (freezeBtn) freezeBtn.disabled = !admin;
  if (cancelBtn) cancelBtn.disabled = !admin;
}

function closeCardModal() {
  document.getElementById("cardModal").style.display = "none";
  currentCardId = null;
  currentCardStripeId = null;

  if (sensitiveDataTimeout) {
    clearTimeout(sensitiveDataTimeout);
    sensitiveDataTimeout = null;
  }
}

// ============ ACCIONES EN MODAL ============

async function freezeCardFromModal() {
  if (!currentCardId) return;

  if (
    confirm("¿Congelar esta tarjeta? No se podrá usar hasta descongelarla.")
  ) {
    await performCardAction(currentCardId, "freeze");
  }
}

async function cancelCardFromModal() {
  if (!currentCardId) return;

  if (confirm("⚠️  ¿Cancelar esta tarjeta? NO se podrá revertir.")) {
    await performCardAction(currentCardId, "cancel");
  }
}

async function performCardAction(cardId, action) {
  try {
    if (!apiToken) {
      addLog("⚠️ Iniciá sesión para ejecutar acciones", "warning");
      return;
    }

    if (!isAdmin()) {
      addLog("❌ Tu rol no permite ejecutar esta acción", "error");
      return;
    }

    const url =
      action === "freeze"
        ? `${API_BASE}/cards/${cardId}/freeze`
        : `${API_BASE}/cards/${cardId}/cancel`;

    addLog(`🔄 Ejecutando acción: ${action}...`, "info");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    });
    const data = await response.json();

    if (response.ok && data.success) {
      addLog(`✅ Acción completada: ${data.message}`, "success");
      closeCardModal();
      setTimeout(() => {
        refreshCards();
        refreshMetrics();
      }, 500);
    } else {
      addLog(`❌ Error: ${data.error}`, "error");
    }
  } catch (error) {
    addLog(`❌ Error: ${error.message}`, "error");
  }
}

async function copyStripeIdFromModal() {
  if (!currentCardStripeId) {
    addLog("⚠️ Esta tarjeta no tiene ID Stripe disponible", "warning");
    return;
  }

  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      const tempInput = document.createElement("textarea");
      tempInput.value = currentCardStripeId;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
    } else {
      await navigator.clipboard.writeText(currentCardStripeId);
    }

    addLog("✅ ID Stripe copiado al portapapeles", "success");
  } catch (error) {
    addLog(`❌ No se pudo copiar el ID Stripe: ${error.message}`, "error");
  }
}

async function revealSensitiveCardData() {
  if (!currentCardId) {
    addLog("⚠️ No hay tarjeta seleccionada", "warning");
    return;
  }

  const accepted = confirm(
    "Se mostrará número y CVC por 30 segundos. No compartas estos datos.",
  );

  if (!accepted) {
    return;
  }

  try {
    if (!apiToken) {
      addLog("⚠️ Iniciá sesión para revelar datos", "warning");
      return;
    }

    if (!isAdmin()) {
      addLog("❌ Tu rol no permite revelar datos sensibles", "error");
      return;
    }

    addLog("👁️ Solicitando número y CVC a Stripe...", "info");

    const response = await fetch(`${API_BASE}/cards/${currentCardId}/reveal`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      addLog(
        `❌ No se pudo revelar: ${data.error || "Error desconocido"}`,
        "error",
      );
      return;
    }

    const container = document.getElementById("sensitiveDataContainer");
    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="sensitive-header">⚠️ Datos sensibles (visible 30s)</div>
      <div class="sensitive-row"><strong>Número:</strong> <span>${formatCardNumber(data.data.number)}</span></div>
      <div class="sensitive-row"><strong>CVC:</strong> <span>${data.data.cvc}</span></div>
      <div class="sensitive-row"><strong>Exp:</strong> <span>${formatCardExpiry(data.data.expMonth, data.data.expYear)}</span></div>
    `;
    container.style.display = "block";

    if (sensitiveDataTimeout) {
      clearTimeout(sensitiveDataTimeout);
    }

    sensitiveDataTimeout = setTimeout(() => {
      const liveContainer = document.getElementById("sensitiveDataContainer");
      if (liveContainer) {
        liveContainer.style.display = "none";
        liveContainer.innerHTML = "";
      }
      addLog("🔒 Datos sensibles ocultados automáticamente", "info");
    }, 30000);

    addLog("✅ Número y CVC visibles temporalmente", "success");
  } catch (error) {
    addLog(`❌ Error al revelar datos: ${error.message}`, "error");
  }
}

async function saveApiCredentials() {
  const user = document.getElementById("apiUser").value.trim();
  const pass = document.getElementById("apiPass").value;

  if (!user || !pass) {
    addLog("⚠️ Completá usuario y contraseña", "warning");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: user, password: pass }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      addLog(
        `❌ Login fallido: ${data.error || "Error desconocido"}`,
        "error",
      );
      return;
    }

    apiToken = data.data.token;
    currentUser = data.data.user;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, apiToken);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    updateAuthStatus();
    addLog(
      `✅ Sesión iniciada como ${currentUser.username} (${currentUser.role})`,
      "success",
    );
  } catch (error) {
    addLog(`❌ Error de login: ${error.message}`, "error");
  }
}

function clearApiCredentials() {
  apiToken = "";
  currentUser = null;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  document.getElementById("apiUser").value = "";
  document.getElementById("apiPass").value = "";
  updateAuthStatus();
  addLog("🧹 Sesión cerrada", "info");
}

function restoreApiCredentials() {
  const savedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  const savedUser = sessionStorage.getItem(USER_STORAGE_KEY);

  if (savedToken) {
    apiToken = savedToken;
  }

  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (error) {
      currentUser = null;
    }
  }
}

function getAuthHeaders() {
  if (!apiToken) {
    return {};
  }

  return { Authorization: `Bearer ${apiToken}` };
}

function updateAuthStatus() {
  const authStatus = document.getElementById("authStatus");
  if (!authStatus) {
    return;
  }

  authStatus.textContent = apiToken
    ? `Sesión activa: ${currentUser?.username || "usuario"} (${currentUser?.role || "sin rol"})`
    : "Sin sesión iniciada.";
  authStatus.className = apiToken
    ? "auth-status auth-ok"
    : "auth-status auth-empty";
}

function exportCardsCsv() {
  const cardsToExport =
    activeFilter === "all"
      ? allCards
      : allCards.filter((card) => card.status === activeFilter);

  if (cardsToExport.length === 0) {
    addLog("⚠️ No hay tarjetas para exportar con el filtro actual", "warning");
    return;
  }

  const headers = [
    "id",
    "holderName",
    "brand",
    "lastFour",
    "status",
    "expMonth",
    "expYear",
    "createdAt",
    "expiresAt",
  ];

  const escapeCsv = (value) => {
    const text = value === undefined || value === null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const rows = cardsToExport.map((card) =>
    [
      card.id,
      card.holderName,
      card.brand,
      card.lastFour,
      card.status,
      card.expMonth,
      card.expYear,
      card.createdAt,
      card.expiresAt,
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  a.href = url;
  a.download = `tarjetas-${activeFilter}-${timestamp}.csv`;
  a.click();

  URL.revokeObjectURL(url);
  addLog(`✅ CSV exportado (${cardsToExport.length} tarjeta(s))`, "success");
}

// ============ SISTEMA DE LOGS ============

function addLog(message, type = "info") {
  const logContainer = document.getElementById("logContainer");
  const timestamp = new Date().toLocaleTimeString("es-ES");

  const logEntry = document.createElement("div");
  logEntry.className = `log-entry log-${type}`;
  logEntry.textContent = `[${timestamp}] ${message}`;

  logContainer.appendChild(logEntry);

  // Auto-scroll al último log
  logContainer.scrollTop = logContainer.scrollHeight;

  // Mantener máximo 50 logs
  const entries = logContainer.querySelectorAll(".log-entry");
  if (entries.length > 50) {
    entries[0].remove();
  }

  // También loguear en consola del navegador
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function clearLogs() {
  document.getElementById("logContainer").innerHTML = "";
  addLog("Logs limpiados", "info");
}

// ============ UTILIDADES ============

function translateStatus(status) {
  const translations = {
    active: "✅ Activa",
    frozen: "❄️  Congelada",
    cancelled: "🗑️  Cancelada",
  };
  return translations[status] || status;
}

function translateAction(action) {
  const translations = {
    created: "🆕 Creada",
    frozen: "❄️  Congelada",
    cancelled: "🗑️  Cancelada",
  };
  return translations[action] || action;
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
}

function formatCardExpiry(month, year) {
  if (!month || !year) {
    return "No disponible";
  }

  return `${String(month).padStart(2, "0")}/${year}`;
}

function formatCardNumber(number) {
  if (!number) {
    return "No disponible";
  }

  return number.replace(/(.{4})/g, "$1 ").trim();
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
  element.style.display = "block";

  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}

// ============ CERRAR MODAL AL CLICKEAR FUERA ============

window.addEventListener("click", (event) => {
  const modal = document.getElementById("cardModal");
  if (event.target === modal) {
    closeCardModal();
  }
});
