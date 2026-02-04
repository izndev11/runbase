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
    card.className = "bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100";

    const dataFmt = inscricao.evento?.dataEvento
      ? new Date(inscricao.evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";

    card.innerHTML = `
      <div class="h-20 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400"></div>
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Status: ${inscricao.status}</span>
          <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Data: ${dataFmt}</span>
        </div>
        <h3 class="text-xl font-bold mb-2">${inscricao.evento?.titulo || "Evento"}</h3>
        <p class="text-gray-600 mb-4">Local: ${inscricao.evento?.local || "-"}</p>

        <div class="flex gap-3 items-center">
          <button class="bg-red-600 text-white px-4 py-2 rounded-full font-bold hover:bg-red-700" data-cancelar>
            Cancelar
          </button>
          <div class="text-sm text-gray-600" data-status></div>
        </div>
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


