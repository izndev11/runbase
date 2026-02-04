const token = localStorage.getItem("token");
const form = document.getElementById("adminEventoForm");
const statusEl = document.getElementById("adminStatus");
const listEl = document.getElementById("adminEventosList");
const inscricoesEl = document.getElementById("adminInscricoesList");
const editIdEl = document.getElementById("adminEventoId");
const cancelEditBtn = document.getElementById("adminCancelEdit");
const saveBtn = document.getElementById("adminSaveBtn");
const exportCsvBtn = document.getElementById("adminExportCsv");
let lastInscricoesEventoId = null;
let lastInscricoesEventoTitulo = "";

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function setEditMode(evento) {
  if (!editIdEl || !form) return;
  document.getElementById("adminTitulo").value = evento.titulo || "";
  document.getElementById("adminData").value = evento.dataEvento
    ? new Date(evento.dataEvento).toISOString().slice(0, 10)
    : "";
  document.getElementById("adminLocal").value = evento.local || "";
  editIdEl.value = String(evento.id);
  if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");
  if (saveBtn) saveBtn.textContent = "Atualizar evento";
}

function clearEditMode() {
  if (!editIdEl || !form) return;
  editIdEl.value = "";
  if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
  if (saveBtn) saveBtn.textContent = "Salvar evento";
  form.reset();
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
    item.className = "border rounded-lg px-3 py-2 flex flex-col gap-2";
    const dataFmt = evento.dataEvento
      ? new Date(evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";
    item.innerHTML = `
      <strong>${evento.titulo}</strong>
      <span class="text-sm text-gray-600">Data: ${dataFmt}</span>
      <span class="text-sm text-gray-600">Local: ${evento.local}</span>
      <span class="text-sm text-gray-600">Inscrições: ${evento._count?.inscricoes ?? 0}</span>
      <div class="flex gap-2">
        <button data-edit class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-300">Editar</button>
        <button data-delete class="bg-red-600 text-white px-3 py-1 rounded-full font-bold hover:bg-red-700">Excluir</button>
        <button data-inscricoes class="bg-blue-600 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700">Ver inscrições</button>
      </div>
    `;
    const editBtn = item.querySelector("[data-edit]");
    const delBtn = item.querySelector("[data-delete]");
    const inscBtn = item.querySelector("[data-inscricoes]");

    editBtn.addEventListener("click", () => setEditMode(evento));
    delBtn.addEventListener("click", async () => {
      if (!confirm("Deseja realmente excluir este evento?")) return;
      try {
        const response = await fetch(`http://localhost:3000/admin/eventos/${evento.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          setStatus(data.error || "Erro ao excluir evento");
          return;
        }
        setStatus("Evento removido");
        carregarEventos();
      } catch (err) {
        console.error(err);
        setStatus("Erro de conexão com o servidor");
      }
    });
    inscBtn.addEventListener("click", async () => {
      await carregarInscricoes(evento.id, evento.titulo);
    });
    listEl.appendChild(item);
  });
}

function renderInscricoes(inscricoes, titulo) {
  if (!inscricoesEl) return;
  lastInscricoesEventoTitulo = titulo;
  if (exportCsvBtn) exportCsvBtn.classList.remove("hidden");
  if (!inscricoes.length) {
    inscricoesEl.innerHTML = `<p>Nenhuma inscrição para ${titulo}.</p>`;
    return;
  }
  const linhas = inscricoes.map((i) => {
    return `
      <div class="border rounded-lg px-3 py-2 mb-2">
        <strong>${i.usuario?.nome_completo || "Usuário"}</strong>
        <div class="text-sm text-gray-600">${i.usuario?.email || "-"}</div>
        <div class="text-sm text-gray-600">Status: ${i.status}</div>
      </div>
    `;
  });
  inscricoesEl.innerHTML = `<div class="mb-2 font-semibold">Evento: ${titulo}</div>` + linhas.join("");
}

async function carregarInscricoes(eventoId, titulo) {
  if (!token) return;
  lastInscricoesEventoId = eventoId;
  try {
    if (inscricoesEl) inscricoesEl.innerHTML = "Carregando inscrições...";
    const response = await fetch(`http://localhost:3000/admin/eventos/${eventoId}/inscricoes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      if (inscricoesEl) inscricoesEl.innerHTML = data.error || "Erro ao carregar inscrições";
      return;
    }
    renderInscricoes(data, titulo);
  } catch (err) {
    console.error(err);
    if (inscricoesEl) inscricoesEl.innerHTML = "Erro de conexão com o servidor";
  }
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
  const eventoId = editIdEl ? editIdEl.value : "";

  if (!titulo || !dataEvento || !local) {
    setStatus("Preencha todos os campos");
    return;
  }

  try {
    setStatus(eventoId ? "Atualizando..." : "Salvando...");
    const response = await fetch(
      eventoId ? `http://localhost:3000/admin/eventos/${eventoId}` : "http://localhost:3000/admin/eventos",
      {
        method: eventoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo, dataEvento, local }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Erro ao salvar evento");
      return;
    }

    setStatus(eventoId ? "Evento atualizado!" : "Evento cadastrado!");
    clearEditMode();
    carregarEventos();
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", clearEditMode);
}

if (form) {
  form.addEventListener("submit", criarEvento);
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", async () => {
    if (!lastInscricoesEventoId) return;
    try {
      const response = await fetch(
        `http://localhost:3000/admin/eventos/${lastInscricoesEventoId}/inscricoes.csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        setStatus("Erro ao exportar CSV");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inscricoes_${lastInscricoesEventoId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(`CSV exportado (${lastInscricoesEventoTitulo})`);
    } catch (err) {
      console.error(err);
      setStatus("Erro de conexão ao exportar CSV");
    }
  });
}

carregarEventos();
