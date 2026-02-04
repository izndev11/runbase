const token = localStorage.getItem("token");
const form = document.getElementById("adminEventoForm");
const statusEl = document.getElementById("adminStatus");
const listEl = document.getElementById("adminEventosList");
const inscricoesEl = document.getElementById("adminInscricoesList");
const editIdEl = document.getElementById("adminEventoId");
const cancelEditBtn = document.getElementById("adminCancelEdit");
const saveBtn = document.getElementById("adminSaveBtn");
const exportCsvBtn = document.getElementById("adminExportCsv");
const imagemFileEl = document.getElementById("adminImagemFile");
const imagemPreviewEl = document.getElementById("adminImagemPreview");
const imagemRemoveEl = document.getElementById("adminImagemRemove");
const imagemHintEl = document.getElementById("adminImagemHint");
const imagemUrlEl = document.getElementById("adminImagemUrl");

const CLOUDINARY_CLOUD_NAME = "dfznaddhi";
const CLOUDINARY_UPLOAD_PRESET = "rrunbasedev";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

let lastInscricoesEventoId = null;
let lastInscricoesEventoTitulo = "";

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function setImagemPreview(url) {
  if (!imagemPreviewEl) return;
  if (url) {
    imagemPreviewEl.src = url;
    imagemPreviewEl.classList.remove("hidden");
    if (imagemRemoveEl) imagemRemoveEl.classList.remove("hidden");
  } else {
    imagemPreviewEl.src = "";
    imagemPreviewEl.classList.add("hidden");
    if (imagemRemoveEl) imagemRemoveEl.classList.add("hidden");
  }
}

function setImagemHint(message) {
  if (imagemHintEl) imagemHintEl.textContent = message || "";
}


function setEditMode(evento) {
  if (!editIdEl || !form) return;
  document.getElementById("adminTitulo").value = evento.titulo || "";
  document.getElementById("adminData").value = evento.dataEvento
    ? new Date(evento.dataEvento).toISOString().slice(0, 10)
    : "";
  document.getElementById("adminLocal").value = evento.local || "";
  document.getElementById("adminOrganizador").value = evento.organizador || "";
  document.getElementById("adminImagemUrl").value = evento.imagem_url || "";
  document.getElementById("adminDescricao").value = evento.descricao || "";
  const categoriasTexto = Array.isArray(evento.categorias)
    ? evento.categorias.map((c) => c.nome).join(", ")
    : "";
  document.getElementById("adminCategorias").value = categoriasTexto;
  editIdEl.value = String(evento.id);
  setImagemPreview(evento.imagem_url || "");
  setImagemHint(evento.imagem_url ? "Imagem atual carregada." : "");
  if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");
  if (saveBtn) saveBtn.textContent = "Atualizar evento";
}

function clearEditMode() {
  if (!editIdEl || !form) return;
  editIdEl.value = "";
  if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
  if (saveBtn) saveBtn.textContent = "Salvar evento";
  form.reset();
  setImagemPreview("");
  setImagemHint("");
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
    const categoriasTexto = evento.categorias?.length
      ? evento.categorias.map((c) => c.nome).join(", ")
      : "â€”";
    item.innerHTML = `
      <strong>${evento.titulo}</strong>
      <span class="text-sm text-gray-600">Data: ${dataFmt}</span>
      <span class="text-sm text-gray-600">Local: ${evento.local}</span>
      <span class="text-sm text-gray-600">Organizador: ${evento.organizador || "â€”"}</span>
      <span class="text-sm text-gray-600">Categorias: ${categoriasTexto}</span>
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
        <div class="mt-2 flex flex-wrap gap-2">
          <button data-resend="inscricao" data-id="${i.id}"
                  class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-300">
            Reenviar inscrição
          </button>
          <button data-resend="pagamento" data-id="${i.id}"
                  class="bg-blue-600 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700">
            Reenviar pagamento
          </button>
        </div>
      </div>
    `;
  });
  inscricoesEl.innerHTML = `<div class="mb-2 font-semibold">Evento: ${titulo}</div>` + linhas.join("");

  inscricoesEl.querySelectorAll("[data-resend]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const tipo = btn.getAttribute("data-resend");
      if (!id || !tipo) return;
      await reenviarEmail(Number(id), tipo);
    });
  });
}

async function reenviarEmail(inscricaoId, tipo) {
  if (!token) return;
  try {
    setStatus("Reenviando e-mail...");
    const response = await fetch(`http://localhost:3000/admin/inscricoes/${inscricaoId}/reenviar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tipo }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Erro ao reenviar e-mail");
      return;
    }
    setStatus(data.message || "E-mail reenviado!");
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão ao reenviar e-mail");
  }
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
  const organizador = document.getElementById("adminOrganizador").value;
  const imagem_url = document.getElementById("adminImagemUrl").value;
  const descricao = document.getElementById("adminDescricao").value;
  const categorias = document.getElementById("adminCategorias").value;
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
        body: JSON.stringify({
          titulo,
          dataEvento,
          local,
          organizador,
          imagem_url,
          descricao,
          categorias,
        }),
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

async function uploadImagem(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato inválido. Use PNG, JPG ou WEBP.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Imagem muito grande (máx. 3MB).");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Erro ao enviar imagem");
  }
  return data.secure_url;
}

if (imagemFileEl) {
  imagemFileEl.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setStatus("Enviando imagem...");
      setImagemHint("Enviando...");
      if (saveBtn) saveBtn.disabled = true;
      const url = await uploadImagem(file);
      if (imagemUrlEl) imagemUrlEl.value = url;
      setImagemPreview(url);
      setStatus("Imagem enviada!");
      setImagemHint("Upload concluído.");
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Erro ao enviar imagem");
      setImagemHint("Falha no upload.");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  });
}

if (imagemUrlEl) {
  imagemUrlEl.addEventListener("input", () => {
    const url = imagemUrlEl.value.trim();
    if (!url) {
      setImagemPreview("");
      setImagemHint("");
      return;
    }
    setImagemPreview(url);
    setImagemHint("Pré-visualizando URL.");
  });
}

if (imagemRemoveEl) {
  imagemRemoveEl.addEventListener("click", () => {
    if (imagemUrlEl) imagemUrlEl.value = "";
    if (imagemFileEl) imagemFileEl.value = "";
    setImagemPreview("");
    setImagemHint("Imagem removida.");
  });
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

async function carregarEventosDebug() {
  if (!token) return;
  try {
    const response = await fetch("http://localhost:3000/admin/eventos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      setStatus(
        `Erro ao carregar eventos (${response.status}): ${data?.error || "sem mensagem"}`
      );
      return;
    }

    if (Array.isArray(data)) {
      setStatus(`Eventos carregados: ${data.length}`);
      renderEventos(data);
      return;
    }

    setStatus("Resposta inesperada do servidor ao listar eventos.");
  } catch (err) {
    console.error(err);
    setStatus(`Erro de conexão com o servidor: ${err?.message || err}`);
  }
}

carregarEventosDebug();



