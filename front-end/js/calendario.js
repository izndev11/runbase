const listEl = document.getElementById("calendarioEventos");
const statusEl = document.getElementById("calendarioStatus");
const token = localStorage.getItem("token");
const buscaInputEl = document.getElementById("calendarioBuscaInput");
const buscaBtnEl = document.getElementById("calendarioBuscaBtn");

let cachedEventos = [];
let cachedInscritos = new Set();

function setInscritoUI({ btn, status }) {
  if (btn) {
    btn.textContent = "Inscrito";
    btn.disabled = true;
    btn.classList.add("opacity-60", "cursor-not-allowed");
  }
  if (status) {
    status.textContent = "Inscrito";
  }
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function renderEventos(eventos, inscritosSet) {
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
    const isInscrito = inscritosSet?.has(evento.id);
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
        <span class="ticket-card__status">Inscrições abertas</span>
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
        <div class="ticket-card__actions">
          <a href="${detalhesUrl}" class="ticket-card__btn ticket-card__btn--light">
            Ver detalhes
          </a>
          <button data-action="inscrever" class="ticket-card__btn ticket-card__btn--primary">
            ${isInscrito ? "Inscrito" : "Inscrever-se"}
          </button>
        </div>
        <div class="ticket-card__status-text" data-status></div>
      </div>
    `;

    const btn = card.querySelector('[data-action="inscrever"]');
    const status = card.querySelector("[data-status]");

    if (isInscrito) {
      setInscritoUI({ btn, status });
    }

    btn.addEventListener("click", async () => {
      if (!token) {
        window.location.href = "login.html";
        return;
      }
      try {
        btn.disabled = true;
        status.textContent = "Criando inscrição...";

        const response = await fetch("http://localhost:3000/api/inscricoes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ eventoId: evento.id }),
        });

        const data = await response.json();
        if (!response.ok) {
          const errorMessage = data?.error || "Erro ao inscrever";
          if (errorMessage.toLowerCase().includes("inscrito")) {
            setInscritoUI({ btn, status });
            return;
          }
          status.textContent = errorMessage;
          btn.disabled = false;
          return;
        }

        setInscritoUI({ btn, status });
      } catch (err) {
        console.error(err);
        status.textContent = "Erro de conexão com o servidor";
        btn.disabled = false;
      }
    });

    listEl.appendChild(card);
  });
}

async function carregarInscricoes() {
  if (!token) return new Set();
  try {
    const response = await fetch("http://localhost:3000/api/inscricoes/minhas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return new Set();
    const inscricoes = await response.json();
    return new Set(
      inscricoes
        .filter((inscricao) => inscricao.status !== "CANCELADO")
        .map((inscricao) => inscricao.eventoId)
    );
  } catch (err) {
    console.error(err);
    return new Set();
  }
}

function filtrarEventos(term) {
  const query = term.trim().toLowerCase();
  if (!query) {
    renderEventos(cachedEventos, cachedInscritos);
    return;
  }
  const filtrados = cachedEventos.filter((evento) => {
    const titulo = String(evento.titulo || "").toLowerCase();
    const local = String(evento.local || "").toLowerCase();
    const org = String(evento.organizador || evento.organizacao || "").toLowerCase();
    return titulo.includes(query) || local.includes(query) || org.includes(query);
  });
  renderEventos(filtrados, cachedInscritos);
}

async function carregarEventos() {
  setStatus("Carregando eventos...");
  try {
    const [response, inscritosSet] = await Promise.all([
      fetch("http://localhost:3000/eventos"),
      carregarInscricoes(),
    ]);
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
    cachedInscritos = inscritosSet;
    setStatus("");
    renderEventos(ordenados, inscritosSet);
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

if (buscaInputEl) {
  buscaInputEl.addEventListener("input", () => filtrarEventos(buscaInputEl.value));
}
if (buscaBtnEl && buscaInputEl) {
  buscaBtnEl.addEventListener("click", () => filtrarEventos(buscaInputEl.value));
}

carregarEventos();



