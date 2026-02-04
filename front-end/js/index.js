const listEl = document.getElementById("indexEventos");
const statusEl = document.getElementById("indexStatus");
const buscaInputEl = document.getElementById("indexBuscaInput");
const buscaBtnEl = document.getElementById("indexBuscaBtn");

let cachedEventos = [];

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function renderEventos(eventos) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!eventos.length) {
    listEl.innerHTML = "<p>Nenhum evento encontrado.</p>";
    return;
  }

  eventos.forEach((evento) => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const dataFmt = evento.dataEvento
      ? new Date(evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";
    const imagem = evento.imagem_url || evento.imagem || "img/fundo1.png";
    const organizador = evento.organizador || evento.organizacao || "SpeedRun";
    const detalhesUrl = `corrida.html?id=${evento.id}`;

    card.innerHTML = `
      <div class="ticket-card__media">
        <a href="${detalhesUrl}">
          <img src="${imagem}" alt="${evento.titulo}" class="ticket-card__image" />
        </a>
        <button type="button" class="ticket-card__fav" aria-label="Favoritar">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <div class="ticket-card__body">
        <div class="ticket-card__status-wrap">
          <span class="ticket-card__status">InscriÃ§Ãµes abertas</span>
        </div>
        <a href="${detalhesUrl}" class="ticket-card__title" title="${evento.titulo}">
          ${evento.titulo}
        </a>
        <div class="ticket-card__meta">
          <div class="ticket-card__row">
            <i class="fa-solid fa-flag"></i>
            <span>${organizador}</span>
          </div>
          <div class="ticket-card__row">
            <i class="fa-regular fa-calendar"></i>
            <span>${dataFmt}</span>
          </div>
          <div class="ticket-card__row">
            <i class="fa-solid fa-location-dot"></i>
            <span>${evento.local || "-"}</span>
          </div>
        </div>
      </div>
    `;

    listEl.appendChild(card);
  });
}

function filtrarEventos(term) {
  const query = term.trim().toLowerCase();
  if (!query) {
    renderEventos(cachedEventos);
    return;
  }
  const filtrados = cachedEventos.filter((evento) => {
    const titulo = String(evento.titulo || "").toLowerCase();
    const local = String(evento.local || "").toLowerCase();
    const org = String(evento.organizador || evento.organizacao || "").toLowerCase();
    return titulo.includes(query) || local.includes(query) || org.includes(query);
  });
  renderEventos(filtrados);
}

async function carregarEventos() {
  setStatus("Carregando eventos...");
  try {
    const response = await fetch("http://localhost:3000/eventos");
    const eventos = await response.json();

    if (!response.ok) {
      setStatus(eventos.error || "Erro ao carregar eventos");
      return;
    }

    const ordenados = [...eventos].sort((a, b) => {
      const da = a.dataEvento ? new Date(a.dataEvento).getTime() : 0;
      const db = b.dataEvento ? new Date(b.dataEvento).getTime() : 0;
      return da - db;
    });

    cachedEventos = ordenados;
    setStatus("");
    renderEventos(ordenados.slice(0, 8));
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexÃ£o com o servidor");
  }
}

if (buscaInputEl) {
  buscaInputEl.addEventListener("input", () => filtrarEventos(buscaInputEl.value));
}
if (buscaBtnEl && buscaInputEl) {
  buscaBtnEl.addEventListener("click", () => filtrarEventos(buscaInputEl.value));
}

carregarEventos();
