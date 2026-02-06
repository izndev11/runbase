const listEl = document.getElementById("calendarioEventos");
const statusEl = document.getElementById("calendarioStatus");
const token = localStorage.getItem("token");
const buscaInputEl = document.getElementById("calendarioBuscaInput");
const buscaBtnEl = document.getElementById("calendarioBuscaBtn");

let cachedEventos = [];
let cachedInscritos = new Set();
const META_MARKER = "\n\n[[META]]\n";

function extrairMeta(descricao) {
  if (!descricao) return null;
  const index = descricao.indexOf(META_MARKER);
  if (index === -1) return null;
  const metaRaw = descricao.slice(index + META_MARKER.length).trim();
  try {
    return JSON.parse(metaRaw);
  } catch (err) {
    console.error("Erro ao ler meta:", err);
    return null;
  }
}

function truncarTexto(texto, limite) {
  const value = String(texto || "").trim();
  if (!value) return "";
  if (value.length <= limite) return value;
  return `${value.slice(0, limite - 1)}…`;
}

function montarExtras(evento) {
  const meta = extrairMeta(evento?.descricao || "");
  if (!meta) return "";

  const resumo = truncarTexto(meta.resumo, 120);
  const info = [];
  if (meta.cidade) info.push(meta.cidade);
  if (meta.horario) info.push(meta.horario);
  const infoTexto = info.join(" • ");
  const vendas = meta.dataVendas ? `Vendas ate: ${meta.dataVendas}` : "";

  const chips = [];
  if (Array.isArray(meta.percursos)) {
    meta.percursos.slice(0, 3).forEach((p) => {
      const label = p?.km ? `${p.km} km` : p?.nome;
      if (label) chips.push(label);
    });
  }
  if (meta.kits?.completo?.descricao) chips.push("Kit completo");
  if (meta.kits?.economico?.descricao) chips.push("Kit economico");
  if (meta.kits?.basico?.descricao) chips.push("Kit basico");
  const chipsHtml = chips.length
    ? `<div class="ticket-card__chips">${chips
        .slice(0, 4)
        .map((chip) => `<span class="ticket-card__chip">${chip}</span>`)
        .join("")}</div>`
    : "";

  if (!resumo && !infoTexto && !vendas && !chipsHtml) return "";

  return `
    <div class="ticket-card__extras">
      ${resumo ? `<p class="ticket-card__summary">${resumo}</p>` : ""}
      ${infoTexto ? `<div class="ticket-card__detail">${infoTexto}</div>` : ""}
      ${vendas ? `<div class="ticket-card__detail">${vendas}</div>` : ""}
      ${chipsHtml}
    </div>
  `;
}

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
    const detalhesUrl = `corrida-completa.html?id=${evento.id}`;
    const extrasHtml = montarExtras(evento);

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
        ${extrasHtml}
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



