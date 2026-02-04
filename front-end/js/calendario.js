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

    card.innerHTML = `
      <div class="h-24 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400"></div>
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <span class="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">Data: ${dataFmt}</span>
          <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Local: ${evento.local}</span>
        </div>
        <h3 class="text-xl font-bold mb-3">${evento.titulo}</h3>
        <div class="flex items-center gap-3">
          <button class="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700">
            ${isInscrito ? "Inscrito" : "Inscrever-se"}
          </button>
        </div>
        <div class="mt-3 text-sm text-gray-600" data-status></div>
      </div>
    `;

    const btn = card.querySelector("button");
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
