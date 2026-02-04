const token = localStorage.getItem("token");
const listEl = document.getElementById("inscricoesList");
const statusEl = document.getElementById("inscricoesStatus");

if (!token) {
  alert("Faça login primeiro");
  window.location.href = "login.html";
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function renderInscricoes(inscricoes) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!inscricoes.length) {
    listEl.innerHTML = "<p>Você ainda não tem inscrições.</p>";
    return;
  }

  const ordenadas = [...inscricoes].sort((a, b) => {
    const da = a.evento?.dataEvento ? new Date(a.evento.dataEvento).getTime() : 0;
    const db = b.evento?.dataEvento ? new Date(b.evento.dataEvento).getTime() : 0;
    return da - db;
  });

  ordenadas.forEach((inscricao) => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const dataFmt = inscricao.evento?.dataEvento
      ? new Date(inscricao.evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";

    const imagem =
      inscricao.evento?.imagem_url || inscricao.evento?.imagem || "img/fundo1.png";
    const organizador =
      inscricao.evento?.organizador || inscricao.evento?.organizacao || "SpeedRun";
    const detalhesUrl = inscricao.evento?.id
      ? `corrida.html?id=${inscricao.evento.id}`
      : "#";

    card.innerHTML = `
      <div class="ticket-card__media">
        <a href="${detalhesUrl}">
          <img src="${imagem}" alt="${inscricao.evento?.titulo || "Evento"}" class="ticket-card__image" />
        </a>
        <button type="button" class="ticket-card__fav" aria-label="Favoritar">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <div class="ticket-card__body">
        <div class="ticket-card__status-wrap">
          <span class="ticket-card__status">Status: ${inscricao.status}</span>
        </div>
        <a href="${detalhesUrl}" class="ticket-card__title" title="${inscricao.evento?.titulo || "Evento"}">
          ${inscricao.evento?.titulo || "Evento"}
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
            <span>${inscricao.evento?.local || "-"}</span>
          </div>
        </div>
        <div class="ticket-card__actions">
          <a href="${detalhesUrl}" class="ticket-card__btn ticket-card__btn--light">
            Ver detalhes
          </a>
          <button data-cancelar class="ticket-card__btn ticket-card__btn--primary">
            Cancelar
          </button>
        </div>
        <div class="ticket-card__status-text" data-status></div>
      </div>
    `;

    const cancelBtn = card.querySelector("[data-cancelar]");
    const status = card.querySelector("[data-status]");

    cancelBtn.addEventListener("click", async () => {
      try {
        cancelBtn.disabled = true;
        status.textContent = "Cancelando...";

        const response = await fetch(
          `http://localhost:3000/api/inscricoes/${inscricao.id}/cancelar`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
        status.textContent = data.error || "Erro ao cancelar";
          cancelBtn.disabled = false;
          return;
        }

        status.textContent = "Inscrição cancelada";
      } catch (err) {
        console.error(err);
        status.textContent = "Erro de conexão com o servidor";
        cancelBtn.disabled = false;
      }
    });

    listEl.appendChild(card);
  });
}

async function carregarInscricoes() {
  setStatus("Carregando inscrições...");
  try {
    const response = await fetch("http://localhost:3000/api/inscricoes/minhas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const inscricoes = await response.json();

    if (!response.ok) {
      setStatus(inscricoes.error || "Erro ao carregar inscrições");
      return;
    }

    setStatus("");
    renderInscricoes(inscricoes);
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

carregarInscricoes();



