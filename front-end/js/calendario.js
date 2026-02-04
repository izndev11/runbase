const listEl = document.getElementById("calendarioEventos");
const statusEl = document.getElementById("calendarioStatus");
const token = localStorage.getItem("token");

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
    card.className =
      "bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100";

    const dataFmt = evento.dataEvento
      ? new Date(evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";
    const isInscrito = inscritosSet?.has(evento.id);
    const imagem =
      evento.imagem_url || evento.imagem || "img/fundo1.png";
    const organizador = evento.organizador || evento.organizacao || "SpeedRun";
    const detalhesUrl = `corrida.html?id=${evento.id}`;

    card.innerHTML = `
      <div class="p-4">
        <div class="relative">
          <a href="${detalhesUrl}">
            <img src="${imagem}" alt="${evento.titulo}" class="w-full h-48 object-cover rounded-2xl shadow" />
          </a>
          <span class="absolute top-3 left-3 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
            Inscrições abertas
          </span>
          <button type="button" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow">
            <i class="fa-solid fa-heart text-gray-400"></i>
          </button>
        </div>
        <div class="pt-4">
          <a href="${detalhesUrl}" class="block font-extrabold text-sm tracking-wide truncate">
            ${evento.titulo}
          </a>
          <div class="mt-3 space-y-2 text-sm text-gray-700">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-flag text-blue-600"></i>
              <span>${organizador}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-regular fa-calendar text-blue-600"></i>
              <span>${dataFmt}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-location-dot text-blue-600"></i>
              <span>${evento.local || "-"}</span>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <a href="${detalhesUrl}"
               class="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-bold hover:bg-gray-200">
              Ver detalhes
            </a>
            <button data-action="inscrever"
                    class="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700">
              ${isInscrito ? "Inscrito" : "Inscrever-se"}
            </button>
          </div>
          <div class="mt-3 text-sm text-gray-600" data-status></div>
        </div>
      </div>
    `;

    const btn = card.querySelector("[data-action=\"inscrever\"]");
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

    setStatus("");
    renderEventos(ordenados, inscritosSet);
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

carregarEventos();
