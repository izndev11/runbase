const token = localStorage.getItem("token");

const form = document.getElementById("adminEventoForm");
const statusEl = document.getElementById("adminStatus");
const formModeEl = document.getElementById("adminFormMode");
const listEl = document.getElementById("adminEventosList");
const inscricoesEl = document.getElementById("adminInscricoesList");
const exportCsvBtn = document.getElementById("adminExportCsv");
const editIdEl = document.getElementById("adminEventoId");
const cancelEditBtn = document.getElementById("adminCancelEdit");
const saveBtn = document.getElementById("adminSaveBtn");

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

const percursoNomeEl = document.getElementById("percursoNome");
const percursoKmEl = document.getElementById("percursoKm");
const percursoMapaUrlEl = document.getElementById("percursoMapaUrl");
const percursoMapaImagemUrlEl = document.getElementById("percursoMapaImagemUrl");
const percursoMapaImagemFileEl = document.getElementById("percursoMapaImagemFile");
const percursoMapaImagemPreviewEl = document.getElementById("percursoMapaImagemPreview");
const percursoMapaImagemRemoveEl = document.getElementById("percursoMapaImagemRemove");
const percursoMapaImagemHintEl = document.getElementById("percursoMapaImagemHint");
const percursoGpxUrlEl = document.getElementById("percursoGpxUrl");
const percursoGpxFileEl = document.getElementById("percursoGpxFile");
const percursoGpxHintEl = document.getElementById("percursoGpxHint");
const percursoAddEl = document.getElementById("percursoAdd");
const percursoClearEl = document.getElementById("percursoClear");
const percursoListEl = document.getElementById("percursoList");

const kitNomeEl = document.getElementById("adminKitNome");
const kitImagemUrlEl = document.getElementById("adminKitImagemUrl");
const kitImagemFileEl = document.getElementById("adminKitImagemFile");
const kitImagemPreviewEl = document.getElementById("adminKitImagemPreview");
const kitImagemRemoveEl = document.getElementById("adminKitImagemRemove");
const kitImagemHintEl = document.getElementById("adminKitImagemHint");
const kitDescricaoEl = document.getElementById("adminKitDescricao");
const kitAddEl = document.getElementById("adminKitAdd");
const kitClearEl = document.getElementById("adminKitClear");
const kitsListEl = document.getElementById("adminKitsList");

const premiacaoTituloEl = document.getElementById("adminPremiacaoTitulo");
const premiacaoDescricaoEl = document.getElementById("adminPremiacaoDescricao");
const premiacaoAddEl = document.getElementById("adminPremiacaoAdd");
const premiacaoClearEl = document.getElementById("adminPremiacaoClear");
const premiacaoListEl = document.getElementById("adminPremiacaoList");

const CLOUDINARY_CLOUD_NAME = "dfznaddhi";
const CLOUDINARY_UPLOAD_PRESET = "rrunbasedev";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const META_MARKER = "\n\n[[META]]\n";

let opcoes = [];
let percursos = [];
let kits = [];
let premiacoes = [];
let percursoGpxData = "";
let lastInscricoesEventoId = null;
let lastInscricoesEventoTitulo = "";

function setStatus(message) {
  if (statusEl) statusEl.textContent = message || "";
}

function setFormMode(label) {
  if (formModeEl) formModeEl.textContent = label || "Criando";
}

function formatMoeda(value) {
  const numero = Number(value || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
      if (!Number.isNaN(index)) {
        opcoes.splice(index, 1);
        renderOpcoes();
      }
    });
  });
}

function renderPercursos() {
  if (!percursoListEl) return;
  if (!percursos.length) {
    percursoListEl.innerHTML = "<p class=\"text-gray-500\">Nenhum percurso cadastrado.</p>";
    return;
  }

  percursoListEl.innerHTML = percursos
    .map((p, index) => {
      const distancia = p.km ? `${p.km} km` : "";
      const mapaImagem = p.mapaImagemUrl ? `<div class="text-xs text-gray-500">Mapa: imagem enviada</div>` : "";
      const mapaLink = p.mapa ? `<div class="text-xs text-gray-500">Link: ${p.mapa}</div>` : "";
      const mapaGpx = p.gpxUrl || p.gpxData ? `<div class="text-xs text-gray-500">GPX: ${p.gpxUrl ? "URL" : "arquivo"}</div>` : "";
      return `
        <div class="border rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <strong>${p.nome || "Percurso"}</strong>
            <div class="text-xs text-gray-600">${distancia}</div>
            ${mapaImagem}
            ${mapaLink}
            ${mapaGpx}
          </div>
          <button data-remove="${index}" class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-300">
            Remover
          </button>
        </div>
      `;
    })
    .join("");

  percursoListEl.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-remove"));
      if (!Number.isNaN(index)) {
        percursos.splice(index, 1);
        renderPercursos();
      }
    });
  });
}

function renderKits() {
  if (!kitsListEl) return;
  if (!kits.length) {
    kitsListEl.innerHTML = "<p class=\"text-gray-500\">Nenhum kit cadastrado.</p>";
    return;
  }
  kitsListEl.innerHTML = kits
    .map((kit, index) => {
      const nome = kit.nome || "Kit";
      const descricao = kit.descricao || "";
      const imagem = kit.imagemUrl
        ? `<div class="text-xs text-gray-500">Imagem: ${kit.imagemUrl}</div>`
        : "";
      return `
        <div class="border rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <strong>${nome}</strong>
            ${descricao ? `<div class="text-xs text-gray-600">${descricao}</div>` : ""}
            ${imagem}
          </div>
          <button data-remove-kit="${index}" class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-300">
            Remover
          </button>
        </div>
      `;
    })
    .join("");

  kitsListEl.querySelectorAll("[data-remove-kit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-remove-kit"));
      if (!Number.isNaN(index)) {
        kits.splice(index, 1);
        renderKits();
      }
    });
  });
}

function renderPremiacoes() {
  if (!premiacaoListEl) return;
  if (!premiacoes.length) {
    premiacaoListEl.innerHTML = "<p class=\"text-gray-500\">Nenhuma premiação cadastrada.</p>";
    return;
  }
  premiacaoListEl.innerHTML = premiacoes
    .map((item, index) => {
      const titulo = item.titulo || "Premiação";
      const descricao = item.descricao || "";
      return `
        <div class="border rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <strong>${titulo}</strong>
            ${descricao ? `<div class="text-xs text-gray-600">${descricao}</div>` : ""}
          </div>
          <button data-remove-premio="${index}" class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-300">
            Remover
          </button>
        </div>
      `;
    })
    .join("");

  premiacaoListEl.querySelectorAll("[data-remove-premio]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-remove-premio"));
      if (!Number.isNaN(index)) {
        premiacoes.splice(index, 1);
        renderPremiacoes();
      }
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

function getKitFromInputs() {
  const nome = String(kitNomeEl?.value || "").trim();
  const descricao = String(kitDescricaoEl?.value || "").trim();
  const imagemUrl = String(kitImagemUrlEl?.value || "").trim();
  if (!nome && !descricao && !imagemUrl) return null;
  return { nome, descricao, imagemUrl };
}

function clearKitInputs() {
  if (kitNomeEl) kitNomeEl.value = "";
  if (kitDescricaoEl) kitDescricaoEl.value = "";
  if (kitImagemUrlEl) kitImagemUrlEl.value = "";
  if (kitImagemFileEl) kitImagemFileEl.value = "";
  if (kitImagemPreviewEl) {
    kitImagemPreviewEl.src = "";
    kitImagemPreviewEl.classList.add("hidden");
  }
  if (kitImagemRemoveEl) kitImagemRemoveEl.classList.add("hidden");
  if (kitImagemHintEl) kitImagemHintEl.textContent = "";
}

function getPremiacaoFromInputs() {
  const titulo = String(premiacaoTituloEl?.value || "").trim();
  const descricao = String(premiacaoDescricaoEl?.value || "").trim();
  if (!titulo && !descricao) return null;
  return { titulo, descricao };
}

function clearPremiacaoInputs() {
  if (premiacaoTituloEl) premiacaoTituloEl.value = "";
  if (premiacaoDescricaoEl) premiacaoDescricaoEl.value = "";
}

function addPercurso() {
  const nome = String(percursoNomeEl?.value || "").trim();
  const km = String(percursoKmEl?.value || "").trim();
  const mapa = String(percursoMapaUrlEl?.value || "").trim();
  const mapaImagemUrl = String(percursoMapaImagemUrlEl?.value || "").trim();
  const gpxUrl = String(percursoGpxUrlEl?.value || "").trim();
  if (!nome && !km) {
    setStatus("Informe o nome ou a distância do percurso.");
    return;
  }
  percursos.push({ nome, km, mapa, mapaImagemUrl, gpxUrl, gpxData: percursoGpxData });
  if (percursoNomeEl) percursoNomeEl.value = "";
  if (percursoKmEl) percursoKmEl.value = "";
  if (percursoMapaUrlEl) percursoMapaUrlEl.value = "";
  if (percursoMapaImagemUrlEl) percursoMapaImagemUrlEl.value = "";
  if (percursoMapaImagemFileEl) percursoMapaImagemFileEl.value = "";
  if (percursoMapaImagemPreviewEl) percursoMapaImagemPreviewEl.classList.add("hidden");
  if (percursoMapaImagemRemoveEl) percursoMapaImagemRemoveEl.classList.add("hidden");
  if (percursoMapaImagemHintEl) percursoMapaImagemHintEl.textContent = "";
  if (percursoGpxUrlEl) percursoGpxUrlEl.value = "";
  if (percursoGpxFileEl) percursoGpxFileEl.value = "";
  if (percursoGpxHintEl) percursoGpxHintEl.textContent = "";
  percursoGpxData = "";
  setStatus("");
  renderPercursos();
}

function clearPercursos() {
  percursos = [];
  renderPercursos();
}

function montarMeta() {
  const resumo = String(document.getElementById("adminResumo")?.value || "").trim();
  const pcd = String(document.getElementById("adminPcd")?.value || "").trim();
  const dataVendas = String(document.getElementById("adminDataVendas")?.value || "").trim();
  const horario = String(document.getElementById("adminHorario")?.value || "").trim();
  const cidade = String(document.getElementById("adminCidade")?.value || "").trim();
  const enderecoLocal = String(document.getElementById("adminEnderecoLocal")?.value || "").trim();

  const largadas = [
    {
      nome: String(document.getElementById("adminLargada1Nome")?.value || "").trim(),
      endereco: String(document.getElementById("adminLargada1Endereco")?.value || "").trim(),
      horario: String(document.getElementById("adminLargada1Horario")?.value || "").trim(),
    },
    {
      nome: String(document.getElementById("adminLargada2Nome")?.value || "").trim(),
      endereco: String(document.getElementById("adminLargada2Endereco")?.value || "").trim(),
      horario: String(document.getElementById("adminLargada2Horario")?.value || "").trim(),
    },
  ];

  const entrega = {
    itens: [
      {
        data: String(document.getElementById("adminEntrega1Data")?.value || "").trim(),
        local: String(document.getElementById("adminEntrega1Local")?.value || "").trim(),
      },
      {
        data: String(document.getElementById("adminEntrega2Data")?.value || "").trim(),
        local: String(document.getElementById("adminEntrega2Local")?.value || "").trim(),
      },
    ],
    observacoes: String(document.getElementById("adminEntregaObs")?.value || "").trim(),
  };

  const programacao = ["adminProg1", "adminProg2", "adminProg3", "adminProg4", "adminProg5"]
    .map((id) => String(document.getElementById(id)?.value || "").trim())
    .filter(Boolean);

  const contato = {
    email: String(document.getElementById("adminContatoEmail")?.value || "").trim(),
    whatsapp: String(document.getElementById("adminContatoWhatsapp")?.value || "").trim(),
    instagram: String(document.getElementById("adminContatoInstagram")?.value || "").trim(),
    site: String(document.getElementById("adminContatoSite")?.value || "").trim(),
  };

  const links = {
    area: String(document.getElementById("adminLinkArea")?.value || "").trim(),
    protocolo: String(document.getElementById("adminLinkProtocolo")?.value || "").trim(),
    boleto: String(document.getElementById("adminLinkBoleto")?.value || "").trim(),
    organizador: String(document.getElementById("adminLinkOrganizador")?.value || "").trim(),
  };

  return {
    resumo,
    pcd,
    dataVendas,
    horario,
    cidade,
    enderecoLocal,
    largadas,
    percursos: [...percursos],
    kits: [...kits],
    entrega,
    programacao,
    premiacao: [...premiacoes],
    contato,
    links,
  };
}

function montarDescricaoComMeta(meta) {
  const sections = [];
  if (meta.resumo) sections.push(`SOBRE O EVENTO\n${meta.resumo}`);
  if (meta.pcd) sections.push(`INFORMACOES PCD\n${meta.pcd}`);

  const infos = [];
  if (meta.dataVendas) infos.push(`Vendas ate: ${meta.dataVendas}`);
  if (meta.horario) infos.push(`Horario: ${meta.horario}`);
  if (meta.cidade) infos.push(`Cidade/UF: ${meta.cidade}`);
  if (meta.enderecoLocal) infos.push(`Endereco principal: ${meta.enderecoLocal}`);
  if (infos.length) sections.push(`INFO GERAL\n${infos.join("\n")}`);

  const largadas = [];
  meta.largadas.forEach((largada, index) => {
    if (!largada?.nome && !largada?.endereco && !largada?.horario) return;
    const numero = index + 1;
    largadas.push(`Ponto de largada ${numero}: ${largada.nome || "-"}`);
    if (largada.endereco) largadas.push(`Endereco: ${largada.endereco}`);
    if (largada.horario) largadas.push(`Horario: ${largada.horario}`);
  });
  if (largadas.length) sections.push(`LOCAIS E LARGADAS\n${largadas.join("\n")}`);

  if (meta.percursos.length) {
    const lista = meta.percursos.map((p) => {
      const partes = [];
      if (p.nome) partes.push(p.nome);
      if (p.km) partes.push(`${p.km} km`);
      if (p.mapa) partes.push(`Mapa: ${p.mapa}`);
      return `- ${partes.join(" | ")}`;
    });
    sections.push(`PERCURSOS\n${lista.join("\n")}`);
  }

  if (Array.isArray(meta.kits) && meta.kits.length) {
    const kitsTxt = meta.kits
      .map((kit) => {
        const nome = kit?.nome || "Kit";
        const descricao = kit?.descricao ? `\n${kit.descricao}` : "";
        return `${nome}:${descricao}`;
      })
      .join("\n\n");
    sections.push(`KITS\n${kitsTxt}`);
  }

  const entrega = [];
  meta.entrega.itens.forEach((item, index) => {
    if (!item?.data && !item?.local) return;
    const numero = index + 1;
    entrega.push(`Entrega ${numero}: ${item.data || "-"} - ${item.local || "-"}`);
  });
  if (meta.entrega.observacoes) entrega.push(`Obs: ${meta.entrega.observacoes}`);
  if (entrega.length) sections.push(`ENTREGA DE KITS\n${entrega.join("\n")}`);

  if (meta.programacao.length) {
    sections.push(`PROGRAMACAO\n${meta.programacao.map((item) => `- ${item}`).join("\n")}`);
  }

  if (Array.isArray(meta.premiacao) && meta.premiacao.length) {
    const premiacaoTxt = meta.premiacao
      .map((item) => {
        const titulo = item?.titulo || "Premiação";
        const descricao = item?.descricao ? ` ${item.descricao}` : "";
        return `${titulo}:${descricao}`;
      })
      .join("\n");
    sections.push(`PREMIACAO\n${premiacaoTxt}`);
  }

  const contato = [];
  if (meta.contato.email) contato.push(`Email: ${meta.contato.email}`);
  if (meta.contato.whatsapp) contato.push(`WhatsApp: ${meta.contato.whatsapp}`);
  if (meta.contato.instagram) contato.push(`Instagram: ${meta.contato.instagram}`);
  if (meta.contato.site) contato.push(`Site: ${meta.contato.site}`);
  if (contato.length) sections.push(`CONTATO\n${contato.join("\n")}`);

  const links = [];
  if (meta.links.area) links.push(`Area do participante: ${meta.links.area}`);
  if (meta.links.protocolo) links.push(`Protocolo: ${meta.links.protocolo}`);
  if (meta.links.boleto) links.push(`2a via boleto: ${meta.links.boleto}`);
  if (meta.links.organizador) links.push(`Falar com organizador: ${meta.links.organizador}`);
  if (links.length) sections.push(`LINKS\n${links.join("\n")}`);

  const descricaoVisivel = sections.join("\n\n");
  return `${descricaoVisivel}${META_MARKER}${JSON.stringify(meta)}`;
}

function extrairMeta(descricao) {
  if (!descricao) return null;
  const index = descricao.indexOf(META_MARKER);
  if (index === -1) return null;
  const raw = descricao.slice(index + META_MARKER.length).trim();
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function setEditMode(evento) {
  if (!evento) return;
  setFormMode("Editando");
  if (saveBtn) saveBtn.textContent = "Atualizar evento";
  if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");
  if (editIdEl) editIdEl.value = String(evento.id || "");

  document.getElementById("adminTitulo").value = evento.titulo || "";
  document.getElementById("adminData").value = evento.dataEvento
    ? new Date(evento.dataEvento).toISOString().slice(0, 10)
    : "";
  document.getElementById("adminLocal").value = evento.local || "";
  document.getElementById("adminOrganizador").value = evento.organizador || "";
  document.getElementById("adminImagemUrl").value = evento.imagem_url || "";
  document.getElementById("adminBannerUrl").value = evento.banner_url || "";
  setImagemPreview(evento.imagem_url || "");
  setBannerPreview(evento.banner_url || "");

  const meta = evento.meta || extrairMeta(evento.descricao || "") || {};
  document.getElementById("adminResumo").value = meta.resumo || "";
  document.getElementById("adminPcd").value = meta.pcd || "";
  document.getElementById("adminDataVendas").value = meta.dataVendas || "";
  document.getElementById("adminHorario").value = meta.horario || "";
  document.getElementById("adminCidade").value = meta.cidade || "";
  document.getElementById("adminEnderecoLocal").value = meta.enderecoLocal || "";

  document.getElementById("adminLargada1Nome").value = meta.largadas?.[0]?.nome || "";
  document.getElementById("adminLargada1Endereco").value = meta.largadas?.[0]?.endereco || "";
  document.getElementById("adminLargada1Horario").value = meta.largadas?.[0]?.horario || "";
  document.getElementById("adminLargada2Nome").value = meta.largadas?.[1]?.nome || "";
  document.getElementById("adminLargada2Endereco").value = meta.largadas?.[1]?.endereco || "";
  document.getElementById("adminLargada2Horario").value = meta.largadas?.[1]?.horario || "";

  document.getElementById("adminEntrega1Data").value = meta.entrega?.itens?.[0]?.data || "";
  document.getElementById("adminEntrega1Local").value = meta.entrega?.itens?.[0]?.local || "";
  document.getElementById("adminEntrega2Data").value = meta.entrega?.itens?.[1]?.data || "";
  document.getElementById("adminEntrega2Local").value = meta.entrega?.itens?.[1]?.local || "";
  document.getElementById("adminEntregaObs").value = meta.entrega?.observacoes || "";

  document.getElementById("adminProg1").value = meta.programacao?.[0] || "";
  document.getElementById("adminProg2").value = meta.programacao?.[1] || "";
  document.getElementById("adminProg3").value = meta.programacao?.[2] || "";
  document.getElementById("adminProg4").value = meta.programacao?.[3] || "";
  document.getElementById("adminProg5").value = meta.programacao?.[4] || "";

  document.getElementById("adminContatoEmail").value = meta.contato?.email || "";
  document.getElementById("adminContatoWhatsapp").value = meta.contato?.whatsapp || "";
  document.getElementById("adminContatoInstagram").value = meta.contato?.instagram || "";
  document.getElementById("adminContatoSite").value = meta.contato?.site || "";

  document.getElementById("adminLinkArea").value = meta.links?.area || "";
  document.getElementById("adminLinkProtocolo").value = meta.links?.protocolo || "";
  document.getElementById("adminLinkBoleto").value = meta.links?.boleto || "";
  document.getElementById("adminLinkOrganizador").value = meta.links?.organizador || "";

  percursos = Array.isArray(meta.percursos)
    ? meta.percursos.map((p) => ({
        nome: String(p?.nome || "").trim(),
        km: String(p?.km || "").trim(),
        mapa: String(p?.mapa || "").trim(),
        mapaImagemUrl: String(p?.mapaImagemUrl || "").trim(),
        gpxUrl: String(p?.gpxUrl || "").trim(),
        gpxData: String(p?.gpxData || "").trim(),
      }))
    : [];
  renderPercursos();

  if (Array.isArray(meta.kits)) {
    kits = meta.kits.map((kit) => ({
      nome: String(kit?.nome || "").trim(),
      descricao: String(kit?.descricao || "").trim(),
      imagemUrl: String(kit?.imagemUrl || "").trim(),
    }));
  } else if (meta.kits) {
    const map = [
      { key: "completo", label: "Kit completo" },
      { key: "economico", label: "Kit economico" },
      { key: "basico", label: "Kit basico" },
    ];
    kits = map
      .map((item) => {
        const data = meta.kits?.[item.key];
        if (!data?.descricao && !data?.imagemUrl) return null;
        return {
          nome: item.label,
          descricao: String(data?.descricao || "").trim(),
          imagemUrl: String(data?.imagemUrl || "").trim(),
        };
      })
      .filter(Boolean);
  } else {
    kits = [];
  }
  renderKits();

  if (Array.isArray(meta.premiacao)) {
    premiacoes = meta.premiacao.map((item) => ({
      titulo: String(item?.titulo || "").trim(),
      descricao: String(item?.descricao || "").trim(),
    }));
  } else if (meta.premiacao) {
    const map = [
      { key: "participacao", label: "Participação" },
      { key: "top3Geral", label: "Top 3 geral" },
      { key: "top3Categorias", label: "Top 3 categorias" },
      { key: "equipes", label: "Equipes / assessorias" },
    ];
    premiacoes = map
      .map((item) => {
        const texto = meta.premiacao?.[item.key];
        if (!texto) return null;
        return { titulo: item.label, descricao: String(texto).trim() };
      })
      .filter(Boolean);
  } else {
    premiacoes = [];
  }
  renderPremiacoes();
  clearKitInputs();
  clearPremiacaoInputs();

  opcoes = Array.isArray(evento.opcoes)
    ? evento.opcoes.map((o) => ({
        titulo: o.titulo,
        tipo: o.tipo,
        distancia_km: Number(o.distancia_km),
        preco: Number(o.preco),
        taxa_percentual: Number(o.taxa_percentual ?? 0),
      }))
    : [];
  renderOpcoes();

  const categoriasInput = document.getElementById("adminCategoriasInput");
  if (categoriasInput) {
    const categoriasTexto = Array.isArray(evento.categorias)
      ? evento.categorias.map((c) => c.nome).join(", ")
      : "";
    categoriasInput.value = categoriasTexto;
  }
}

function clearEditMode() {
  if (editIdEl) editIdEl.value = "";
  if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
  if (saveBtn) saveBtn.textContent = "Salvar evento";
  setFormMode("Criando");
  if (form) form.reset();
  setImagemPreview("");
  setImagemHint("");
  setBannerPreview("");
  setBannerHint("");
  opcoes = [];
  percursos = [];
  kits = [];
  premiacoes = [];
  renderOpcoes();
  renderPercursos();
  renderKits();
  renderPremiacoes();
  clearKitInputs();
  clearPremiacaoInputs();
  if (percursoMapaImagemPreviewEl) {
    percursoMapaImagemPreviewEl.src = "";
    percursoMapaImagemPreviewEl.classList.add("hidden");
  }
  if (percursoMapaImagemRemoveEl) percursoMapaImagemRemoveEl.classList.add("hidden");
  if (percursoMapaImagemHintEl) percursoMapaImagemHintEl.textContent = "";
  if (percursoGpxUrlEl) percursoGpxUrlEl.value = "";
  if (percursoGpxFileEl) percursoGpxFileEl.value = "";
  if (percursoGpxHintEl) percursoGpxHintEl.textContent = "";
  percursoGpxData = "";
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
      <span class="text-sm text-gray-600">Organizador: ${evento.organizador || "—"}</span>
      <span class="text-sm text-gray-600">Inscrições: ${evento._count?.inscricoes ?? 0}</span>
      <div class="flex gap-2 flex-wrap">
        <button data-edit class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-300">Editar</button>
        <button data-detalhes class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-bold hover:bg-gray-200">Ver detalhes</button>
        <button data-delete class="bg-red-600 text-white px-3 py-1 rounded-full font-bold hover:bg-red-700">Excluir</button>
        <button data-inscricoes class="bg-blue-600 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700">Ver inscrições</button>
      </div>
    `;
    item.querySelector("[data-edit]").addEventListener("click", () => setEditMode(evento));
    item.querySelector("[data-detalhes]").addEventListener("click", () => {
      window.location.href = `evento-detalhe-admin.html?id=${evento.id}`;
    });
    item.querySelector("[data-delete]").addEventListener("click", async () => {
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
        setStatus("Erro de conexão com o servidor");
      }
    });
    item.querySelector("[data-inscricoes]").addEventListener("click", async () => {
      await carregarInscricoes(evento.id, evento.titulo);
    });
    listEl.appendChild(item);
  });
}

async function carregarEventos() {
  if (!token) return;
  try {
    const response = await fetch("http://localhost:3000/admin/eventos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) {
      renderEventos(data);
      return;
    }

    // Fallback: lista publica (quando o backend admin nao esta disponivel).
    const fallbackResponse = await fetch("http://localhost:3000/eventos");
    const fallbackData = await fallbackResponse.json();
    if (!fallbackResponse.ok) {
      setStatus(data.error || fallbackData.error || "Erro ao carregar eventos");
      return;
    }
    setStatus("Usando lista publica de eventos.");
    renderEventos(fallbackData);
  } catch (err) {
    setStatus("Erro de conexao com o servidor");
  }
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
    if (inscricoesEl) inscricoesEl.innerHTML = "Erro de conexão com o servidor";
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
  const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Erro ao enviar imagem");
  }
  return data.secure_url;
}

function wireImageUpload({ fileEl, urlEl, previewEl, removeEl, hintEl, label }) {
  if (fileEl) {
    fileEl.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        setStatus(`Enviando imagem do ${label}...`);
        if (hintEl) hintEl.textContent = "Enviando...";
        if (saveBtn) saveBtn.disabled = true;
        const url = await uploadImagem(file);
        if (urlEl) urlEl.value = url;
        if (previewEl) {
          previewEl.src = url;
          previewEl.classList.remove("hidden");
        }
        if (removeEl) removeEl.classList.remove("hidden");
        if (hintEl) hintEl.textContent = "Upload concluído.";
        setStatus(`Imagem do ${label} enviada!`);
      } catch (err) {
        setStatus(err?.message || `Erro ao enviar imagem do ${label}`);
        if (hintEl) hintEl.textContent = "Falha no upload.";
      } finally {
        if (saveBtn) saveBtn.disabled = false;
      }
    });
  }

  if (urlEl) {
    urlEl.addEventListener("input", () => {
      const url = urlEl.value.trim();
      if (!url) {
        if (previewEl) previewEl.classList.add("hidden");
        if (removeEl) removeEl.classList.add("hidden");
        if (hintEl) hintEl.textContent = "";
        return;
      }
      if (previewEl) {
        previewEl.src = url;
        previewEl.classList.remove("hidden");
      }
      if (removeEl) removeEl.classList.remove("hidden");
      if (hintEl) hintEl.textContent = "Pré-visualizando URL.";
    });
  }

  if (removeEl) {
    removeEl.addEventListener("click", () => {
      if (urlEl) urlEl.value = "";
      if (fileEl) fileEl.value = "";
      if (previewEl) previewEl.classList.add("hidden");
      if (hintEl) hintEl.textContent = "Imagem removida.";
      removeEl.classList.add("hidden");
    });
  }
}

async function salvarEvento(event) {
  event.preventDefault();
  if (!token) return;

  const titulo = document.getElementById("adminTitulo").value.trim();
  const dataEvento = document.getElementById("adminData").value;
  const local = document.getElementById("adminLocal").value.trim();
  const organizador = document.getElementById("adminOrganizador").value.trim();
  const imagem_url = document.getElementById("adminImagemUrl").value.trim();
  const banner_url = document.getElementById("adminBannerUrl").value.trim();
  const categoriasInput = document.getElementById("adminCategoriasInput")?.value || "";
  const eventoId = editIdEl ? editIdEl.value : "";

  if (!titulo || !dataEvento || !local) {
    setStatus("Preencha título, data e local.");
    return;
  }

  const meta = montarMeta();
  const descricao = montarDescricaoComMeta(meta);
  const categorias =
    categoriasInput.trim() ||
    meta.percursos
      .map((p) => (p.km ? `${p.km}K` : p.nome))
      .filter(Boolean)
      .join(", ");

  const originalLabel = saveBtn ? saveBtn.textContent : "";
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = eventoId ? "Atualizando..." : "Salvando...";
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
          meta,
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
    setStatus("Erro de conexão com o servidor");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel || (eventoId ? "Atualizar evento" : "Salvar evento");
    }
  }
}

if (imagemFileEl || imagemUrlEl) {
  wireImageUpload({
    fileEl: imagemFileEl,
    urlEl: imagemUrlEl,
    previewEl: imagemPreviewEl,
    removeEl: imagemRemoveEl,
    hintEl: imagemHintEl,
    label: "imagem principal",
  });
}

if (bannerFileEl || bannerUrlEl) {
  wireImageUpload({
    fileEl: bannerFileEl,
    urlEl: bannerUrlEl,
    previewEl: bannerPreviewEl,
    removeEl: bannerRemoveEl,
    hintEl: bannerHintEl,
    label: "banner",
  });
}

if (percursoMapaImagemFileEl || percursoMapaImagemUrlEl) {
  wireImageUpload({
    fileEl: percursoMapaImagemFileEl,
    urlEl: percursoMapaImagemUrlEl,
    previewEl: percursoMapaImagemPreviewEl,
    removeEl: percursoMapaImagemRemoveEl,
    hintEl: percursoMapaImagemHintEl,
    label: "mapa do percurso",
  });
}

if (percursoGpxFileEl) {
  percursoGpxFileEl.addEventListener("change", () => {
    const file = percursoGpxFileEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      percursoGpxData = String(reader.result || "");
      if (percursoGpxHintEl) percursoGpxHintEl.textContent = "GPX carregado.";
    };
    reader.onerror = () => {
      percursoGpxData = "";
      if (percursoGpxHintEl) percursoGpxHintEl.textContent = "Falha ao ler GPX.";
    };
    reader.readAsText(file);
  });
}

if (percursoGpxUrlEl) {
  percursoGpxUrlEl.addEventListener("input", () => {
    const value = percursoGpxUrlEl.value.trim();
    if (value) {
      percursoGpxData = "";
      if (percursoGpxFileEl) percursoGpxFileEl.value = "";
      if (percursoGpxHintEl) percursoGpxHintEl.textContent = "Usando URL do GPX.";
    } else if (percursoGpxHintEl) {
      percursoGpxHintEl.textContent = "";
    }
  });
}

if (kitImagemFileEl || kitImagemUrlEl) {
  wireImageUpload({
    fileEl: kitImagemFileEl,
    urlEl: kitImagemUrlEl,
    previewEl: kitImagemPreviewEl,
    removeEl: kitImagemRemoveEl,
    hintEl: kitImagemHintEl,
    label: "kit",
  });
}

if (opcaoAddEl) {
  opcaoAddEl.addEventListener("click", () => {
    const opcao = getOpcaoFromInputs();
    if (!opcao) {
      setStatus("Preencha título, distância e preço da opção.");
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

if (percursoAddEl) {
  percursoAddEl.addEventListener("click", addPercurso);
}

if (percursoClearEl) {
  percursoClearEl.addEventListener("click", clearPercursos);
}

if (kitAddEl) {
  kitAddEl.addEventListener("click", () => {
    const kit = getKitFromInputs();
    if (!kit) {
      setStatus("Preencha nome ou descrição do kit.");
      return;
    }
    kits.push(kit);
    renderKits();
    clearKitInputs();
  });
}

if (kitClearEl) {
  kitClearEl.addEventListener("click", () => {
    kits = [];
    renderKits();
  });
}

if (premiacaoAddEl) {
  premiacaoAddEl.addEventListener("click", () => {
    const item = getPremiacaoFromInputs();
    if (!item) {
      setStatus("Informe título ou descrição da premiação.");
      return;
    }
    premiacoes.push(item);
    renderPremiacoes();
    clearPremiacaoInputs();
  });
}

if (premiacaoClearEl) {
  premiacaoClearEl.addEventListener("click", () => {
    premiacoes = [];
    renderPremiacoes();
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", clearEditMode);
}

if (form) {
  form.addEventListener("submit", salvarEvento);
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
      setStatus("Erro de conexão ao exportar CSV");
    }
  });
}

renderOpcoes();
renderPercursos();
renderKits();
renderPremiacoes();
carregarEventos();






