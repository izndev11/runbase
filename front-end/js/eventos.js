const token = localStorage.getItem("token");
const listEl = document.getElementById("eventosList");
const statusEl = document.getElementById("eventosStatus");

if (!token) {
  alert("FaÃ§a login primeiro");
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
    card.className = "bg-white p-5 rounded-2xl shadow-md";

    const dataFmt = evento.dataEvento
      ? new Date(evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";

    card.innerHTML = `
      <h3 class="text-xl font-bold mb-1">${evento.titulo}</h3>
      <p class="text-gray-600 mb-1">Data: ${dataFmt}</p>
      <p class="text-gray-600 mb-4">Local: ${evento.local}</p>
      <button class="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700">
        Inscrever-se
      </button>
      <div class="mt-3 text-sm text-gray-600" data-status></div>
      <button class="mt-3 hidden bg-green-600 text-white px-4 py-2 rounded-full font-bold hover:bg-green-700" data-pay>
        Pagar
      </button>
    `;

    const btn = card.querySelector("button");
    const payBtn = card.querySelector("[data-pay]");
    const status = card.querySelector("[data-status]");

    btn.addEventListener("click", async () => {
      try {
        btn.disabled = true;
        status.textContent = "Criando inscriÃ§Ã£o...";

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

        status.textContent = "InscriÃ§Ã£o criada. Clique em pagar para finalizar.";
        payBtn.classList.remove("hidden");
        payBtn.dataset.inscricaoId = data.id;
      } catch (err) {
        console.error(err);
        status.textContent = "Erro de conexÃ£o com o servidor";
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
        status.textContent = "Erro de conexÃ£o com o servidor";
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
    setStatus("Erro de conexÃ£o com o servidor");
  }
}

carregarEventos();
