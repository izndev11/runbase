const token = localStorage.getItem("token");
const listEl = document.getElementById("eventosList");
const statusEl = document.getElementById("eventosStatus");

if (!token) {
  alert("Faça login primeiro");
  window.location.href = "login.html";
}

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
    card.className = "bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100";

    const dataFmt = evento.dataEvento
      ? new Date(evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";

    card.innerHTML = `
      <div class="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400"></div>
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Data: ${dataFmt}</span>
          <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Local: ${evento.local}</span>
        </div>
        <h3 class="text-xl font-bold mb-3">${evento.titulo}</h3>
        <div class="mb-3 text-sm">
          <a class="text-blue-600 font-semibold hover:underline" href="minhas-inscricoes.html">
            Ver minhas inscrições
          </a>
        </div>

        <div class="flex gap-3 items-center">
          <button class="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700">
            Inscrever-se
          </button>
          <button class="hidden bg-green-600 text-white px-4 py-2 rounded-full font-bold hover:bg-green-700" data-pay>
            Pagar
          </button>
        </div>

        <div class="mt-3 text-sm text-gray-600" data-status></div>
      </div>
    `;

    const btn = card.querySelector("button");
    const payBtn = card.querySelector("[data-pay]");
    const status = card.querySelector("[data-status]");

    btn.addEventListener("click", async () => {
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
          status.textContent = data.error || "Erro ao inscrever";
          btn.disabled = false;
          return;
        }

        status.textContent = "Inscrição criada. Clique em pagar para finalizar.";
        payBtn.classList.remove("hidden");
        payBtn.dataset.inscricaoId = data.id;
      } catch (err) {
        console.error(err);
        status.textContent = "Erro de conexão com o servidor";
        btn.disabled = false;
      }
    });

    payBtn.addEventListener("click", async () => {
      try {
        payBtn.disabled = true;
        status.textContent = "Processando pagamento...";

        const response = await fetch("http://localhost:3000/pagamentos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inscricaoId: Number(payBtn.dataset.inscricaoId),
            metodo: "PIX",
            valor: 100,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          status.textContent = data.error || "Erro ao pagar";
          payBtn.disabled = false;
          return;
        }

        status.textContent = "Pagamento registrado!";
      } catch (err) {
        console.error(err);
        status.textContent = "Erro de conexao com o servidor";
        payBtn.disabled = false;
      }
    });

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

    setStatus("");
    renderEventos(eventos);
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

carregarEventos();
