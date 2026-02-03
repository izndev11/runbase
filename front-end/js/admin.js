const token = localStorage.getItem("token");
const form = document.getElementById("adminEventoForm");
const statusEl = document.getElementById("adminStatus");
const listEl = document.getElementById("adminEventosList");

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function renderEventos(eventos) {
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!eventos.length) {
    listEl.innerHTML = "<p>Nenhum evento cadastrado.</p>";
    return;
  }

  eventos.forEach((evento) => {
    const item = document.createElement("div");
    item.className = "border rounded-lg px-3 py-2 flex flex-col";
    const dataFmt = evento.dataEvento
      ? new Date(evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";
    item.innerHTML = `
      <strong>${evento.titulo}</strong>
      <span class="text-sm text-gray-600">Data: ${dataFmt}</span>
      <span class="text-sm text-gray-600">Local: ${evento.local}</span>
    `;
    listEl.appendChild(item);
  });
}

async function carregarEventos() {
  if (!token) return;
  try {
    const response = await fetch("http://localhost:3000/admin/eventos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Erro ao carregar eventos");
      return;
    }
    renderEventos(data);
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

async function criarEvento(event) {
  event.preventDefault();
  if (!token) return;

  const titulo = document.getElementById("adminTitulo").value;
  const dataEvento = document.getElementById("adminData").value;
  const local = document.getElementById("adminLocal").value;

  if (!titulo || !dataEvento || !local) {
    setStatus("Preencha todos os campos");
    return;
  }

  try {
    setStatus("Salvando...");
    const response = await fetch("http://localhost:3000/admin/eventos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ titulo, dataEvento, local }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Erro ao salvar evento");
      return;
    }

    setStatus("Evento cadastrado!");
    form.reset();
    carregarEventos();
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

if (form) {
  form.addEventListener("submit", criarEvento);
}

carregarEventos();
