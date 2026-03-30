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
let currentCardId = null; // Para acciones en modal

// ============ INICIALIZACIÓN ============

document.addEventListener("DOMContentLoaded", () => {
  addLog("Sistema iniciado. Conectando a servidor...", "info");

  // Cargar tarjetas al iniciar
  setTimeout(() => {
    checkHealthAndLoadCards();
  }, 500);

  // Evento del formulario
  document
    .getElementById("createCardForm")
    .addEventListener("submit", handleCreateCard);
});

// ============ VERIFICACIÓN DE SALUD ============

async function checkHealthAndLoadCards() {
  try {
    const response = await fetch(`${API_BASE}/health`);

    if (response.ok) {
      addLog("✅ Conectado al servidor", "success");
      refreshCards();
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
    const response = await fetch(`${API_BASE}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      renderCards(data.data);
      addLog(`✅ ${data.count} tarjeta(s) cargada(s)`, "success");
    } else {
      addLog("❌ Error al cargar tarjetas", "error");
    }
  } catch (error) {
    addLog(`❌ Error: ${error.message}`, "error");
  }
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
      cardEl.addEventListener("click", () => openCardModal(card));
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
        <button class="card-action-btn" onclick="event.stopPropagation(); openCardModal(${JSON.stringify(card).replace(/"/g, "&quot;")})">
          Ver Detalles
        </button>
      </div>
    </div>
  `;
}

// ============ MODAL DE TARJETA ============

function openCardModal(card) {
  currentCardId = card.id;
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
      <strong>Estado:</strong> <span>${translateStatus(card.status)}</span>
    </div>
    <div class="modal-detail">
      <strong>Creada:</strong> <span>${formatDate(card.createdAt)}</span>
    </div>
    <div class="modal-detail">
      <strong>Expira:</strong> <span>${formatDate(card.expiresAt)} ${isExpired ? "(⏰ Vencida)" : ""}</span>
    </div>
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
}

function closeCardModal() {
  document.getElementById("cardModal").style.display = "none";
  currentCardId = null;
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
    const url =
      action === "freeze"
        ? `${API_BASE}/cards/${cardId}/freeze`
        : `${API_BASE}/cards/${cardId}/cancel`;

    addLog(`🔄 Ejecutando acción: ${action}...`, "info");

    const response = await fetch(url, { method: "POST" });
    const data = await response.json();

    if (response.ok && data.success) {
      addLog(`✅ Acción completada: ${data.message}`, "success");
      closeCardModal();
      setTimeout(() => refreshCards(), 500);
    } else {
      addLog(`❌ Error: ${data.error}`, "error");
    }
  } catch (error) {
    addLog(`❌ Error: ${error.message}`, "error");
  }
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
