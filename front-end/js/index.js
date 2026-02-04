const listEl = document.getElementById("indexEventos");
const statusEl = document.getElementById("indexStatus");

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
    card.className =
      "bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100";

    const dataFmt = evento.dataEvento
      ? new Date(evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";
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
          <div class="mt-4">
            <a href="${detalhesUrl}"
               class="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-bold hover:bg-gray-200">
              Ver detalhes
            </a>
          </div>
        </div>
      </div>
    `;

    listEl.appendChild(card);
  });
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

    setStatus("");
    renderEventos(ordenados.slice(0, 8));
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

carregarEventos();
