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

const bannerFileEl = document.getElementById("adminBannerFile");
const bannerPreviewEl = document.getElementById("adminBannerPreview");
const bannerRemoveEl = document.getElementById("adminBannerRemove");
const bannerHintEl = document.getElementById("adminBannerHint");
const bannerUrlEl = document.getElementById("adminBannerUrl");

const opcaoTituloEl = document.getElementById("adminOpcaoTitulo");
const opcaoTipoEl = document.getElementById("adminOpcaoTipo");
const opcaoDistanciaEl = document.getElementById("adminOpcaoDistancia");
const opcaoPrecoEl = document.getElementById("adminOpcaoPreco");
const opcaoTaxaEl = document.getElementById("adminOpcaoTaxa");
const opcaoAddEl = document.getElementById("adminOpcaoAdd");
const opcaoClearEl = document.getElementById("adminOpcaoClear");
const opcoesListEl = document.getElementById("adminOpcoesList");

const CLOUDINARY_CLOUD_NAME = "dfznaddhi";
const CLOUDINARY_UPLOAD_PRESET = "rrunbasedev";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

let lastInscricoesEventoId = null;
let lastInscricoesEventoTitulo = "";
let opcoes = [];

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

function setBannerPreview(url) {
  if (!bannerPreviewEl) return;
  if (url) {
    bannerPreviewEl.src = url;
    bannerPreviewEl.classList.remove("hidden");
    if (bannerRemoveEl) bannerRemoveEl.classList.remove("hidden");
  } else {
    bannerPreviewEl.src = "";
    bannerPreviewEl.classList.add("hidden");
    if (bannerRemoveEl) bannerRemoveEl.classList.add("hidden");
  }
}

function setBannerHint(message) {
  if (bannerHintEl) bannerHintEl.textContent = message || "";
}

function formatMoeda(value) {
  const numero = Number(value || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderOpcoes() {
  if (!opcoesListEl) return;
  if (!opcoes.length) {
    opcoesListEl.innerHTML = "<p class=\"text-gray-500\">Nenhuma opção cadastrada.</p>";
    return;
  }

  opcoesListEl.innerHTML = opcoes
    .map((opcao, index) => {
      const taxaValor = (opcao.preco * opcao.taxa_percentual) / 100;
      const total = opcao.preco + taxaValor;
      return `
        <div class="border rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <strong>${opcao.titulo}</strong>
            <div class="text-xs text-gray-500">${opcao.tipo} • ${opcao.distancia_km} km</div>
            <div class="text-xs text-gray-600">
              ${formatMoeda(opcao.preco)} + ${formatMoeda(taxaValor)} taxa (${opcao.taxa_percentual}%)
              = ${formatMoeda(total)}
            </div>
          </div>
          <button data-remove="${index}" class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-300">
            Remover
          </button>
        </div>
      `;
    })
    .join("");

  opcoesListEl.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-remove"));
      opcoes.splice(index, 1);
      renderOpcoes();
    });
  });
}

function getOpcaoFromInputs() {
  const titulo = String(opcaoTituloEl?.value || "").trim();
  const tipo = String(opcaoTipoEl?.value || "CORRIDA").trim();
  const distancia_km = Number(opcaoDistanciaEl?.value || 0);
  const preco = Number(opcaoPrecoEl?.value || 0);
  const taxa_percentual = Number(opcaoTaxaEl?.value || 0);
  if (!titulo || !distancia_km || !preco) return null;
  return { titulo, tipo, distancia_km, preco, taxa_percentual };
}

function clearOpcaoInputs() {
  if (opcaoTituloEl) opcaoTituloEl.value = "";
  if (opcaoDistanciaEl) opcaoDistanciaEl.value = "";
  if (opcaoPrecoEl) opcaoPrecoEl.value = "";
  if (opcaoTaxaEl) opcaoTaxaEl.value = "";
}

function setEditMode(evento) {
  if (!editIdEl || !form) {
    setStatus("Use a pagina de criacao de evento para editar.");
    return;
  }
  const tituloEl = document.getElementById("adminTitulo");
  const dataEl = document.getElementById("adminData");
  const localEl = document.getElementById("adminLocal");
  const organizadorEl = document.getElementById("adminOrganizador");
  const imagemUrlElLocal = document.getElementById("adminImagemUrl");
  const bannerUrlElLocal = document.getElementById("adminBannerUrl");
  const descricaoEl = document.getElementById("adminDescricao");
  const categoriasEl = document.getElementById("adminCategorias");

  if (!tituloEl || !dataEl || !localEl || !organizadorEl || !imagemUrlElLocal || !bannerUrlElLocal || !descricaoEl || !categoriasEl) {
    setStatus("Use a pagina de criacao de evento para editar.");
    return;
  }

  tituloEl.value = evento.titulo || "";
  dataEl.value = evento.dataEvento
    ? new Date(evento.dataEvento).toISOString().slice(0, 10)
    : "";
  localEl.value = evento.local || "";
  organizadorEl.value = evento.organizador || "";
  imagemUrlElLocal.value = evento.imagem_url || "";
  bannerUrlElLocal.value = evento.banner_url || "";
  descricaoEl.value = evento.descricao || "";
  const categoriasTexto = Array.isArray(evento.categorias)
    ? evento.categorias.map((c) => c.nome).join(", ")
    : "";
  categoriasEl.value = categoriasTexto;
  editIdEl.value = String(evento.id);
  setImagemPreview(evento.imagem_url || "");
  setImagemHint(evento.imagem_url ? "Imagem atual carregada." : "");
  setBannerPreview(evento.banner_url || "");
  setBannerHint(evento.banner_url ? "Banner atual carregado." : "");
  opcoes = Array.isArray(evento.opcoes) ? evento.opcoes.map((o) => ({
    titulo: o.titulo,
    tipo: o.tipo,
    distancia_km: Number(o.distancia_km),
    preco: Number(o.preco),
    taxa_percentual: Number(o.taxa_percentual ?? 0),
  })) : [];
  renderOpcoes();
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
  setBannerPreview("");
  setBannerHint("");
  opcoes = [];
  renderOpcoes();
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
      : "—";
    item.innerHTML = `
      <strong>${evento.titulo}</strong>
      <span class="text-sm text-gray-600">Data: ${dataFmt}</span>
      <span class="text-sm text-gray-600">Local: ${evento.local}</span>
      <span class="text-sm text-gray-600">Organizador: ${evento.organizador || "—"}</span>
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

    editBtn.addEventListener("click", () => {
      window.location.href = `admin-criar-evento.html?id=${encodeURIComponent(evento.id)}`;
    });
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
  const banner_url = document.getElementById("adminBannerUrl").value;
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
          banner_url,
          descricao,
          categorias,
          opcoes,
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

if (bannerFileEl) {
  bannerFileEl.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setStatus("Enviando banner...");
      setBannerHint("Enviando...");
      if (saveBtn) saveBtn.disabled = true;
      const url = await uploadImagem(file);
      if (bannerUrlEl) bannerUrlEl.value = url;
      setBannerPreview(url);
      setStatus("Banner enviado!");
      setBannerHint("Upload concluído.");
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Erro ao enviar banner");
      setBannerHint("Falha no upload.");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  });
}

if (bannerUrlEl) {
  bannerUrlEl.addEventListener("input", () => {
    const url = bannerUrlEl.value.trim();
    if (!url) {
      setBannerPreview("");
      setBannerHint("");
      return;
    }
    setBannerPreview(url);
    setBannerHint("Pré-visualizando URL.");
  });
}

if (bannerRemoveEl) {
  bannerRemoveEl.addEventListener("click", () => {
    if (bannerUrlEl) bannerUrlEl.value = "";
    if (bannerFileEl) bannerFileEl.value = "";
    setBannerPreview("");
    setBannerHint("Banner removido.");
  });
}

if (opcaoAddEl) {
  opcaoAddEl.addEventListener("click", () => {
    const opcao = getOpcaoFromInputs();
    if (!opcao) {
      setStatus("Preencha título, distância e preço da opção");
      return;
    }
    opcoes.push(opcao);
    renderOpcoes();
    clearOpcaoInputs();
  });
}

if (opcaoClearEl) {
  opcaoClearEl.addEventListener("click", () => {
    opcoes = [];
    renderOpcoes();
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

renderOpcoes();
carregarEventos();

window.adminSetEditMode = setEditMode;
window.adminClearEditMode = clearEditMode;
window.adminSetStatus = setStatus;
window.adminSetOpcoes = (novas) => {
  opcoes = Array.isArray(novas) ? novas : [];
  renderOpcoes();
};
window.adminGetOpcoes = () => opcoes;
window.uploadImagem = uploadImagem;
