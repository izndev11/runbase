const META_MARKER = "\n\n[[META]]\n";

const previewTitulo = document.getElementById("previewTitulo");
const previewCidade = document.getElementById("previewCidade");
const previewOrganizador = document.getElementById("previewOrganizador");
const previewLocal = document.getElementById("previewLocal");
const previewPercursos = document.getElementById("previewPercursos");
const previewKits = document.getElementById("previewKits");

const tituloEl = document.getElementById("adminTitulo");
const organizadorEl = document.getElementById("adminOrganizador");
const cidadeEl = document.getElementById("adminCidade");
const localEl = document.getElementById("adminLocal");
const enderecoLocalEl = document.getElementById("adminEnderecoLocal");

const kitCompletoEl = document.getElementById("adminKitCompleto");
const kitEconomicoEl = document.getElementById("adminKitEconomico");
const kitBasicoEl = document.getElementById("adminKitBasico");

const kitCompletoUrlEl = document.getElementById("adminKitCompletoUrl");
const kitCompletoFileEl = document.getElementById("adminKitCompletoFile");
const kitCompletoPreviewEl = document.getElementById("adminKitCompletoPreview");
const kitCompletoRemoveEl = document.getElementById("adminKitCompletoRemove");
const kitCompletoHintEl = document.getElementById("adminKitCompletoHint");

const kitEconomicoUrlEl = document.getElementById("adminKitEconomicoUrl");
const kitEconomicoFileEl = document.getElementById("adminKitEconomicoFile");
const kitEconomicoPreviewEl = document.getElementById("adminKitEconomicoPreview");
const kitEconomicoRemoveEl = document.getElementById("adminKitEconomicoRemove");
const kitEconomicoHintEl = document.getElementById("adminKitEconomicoHint");

const kitBasicoUrlEl = document.getElementById("adminKitBasicoUrl");
const kitBasicoFileEl = document.getElementById("adminKitBasicoFile");
const kitBasicoPreviewEl = document.getElementById("adminKitBasicoPreview");
const kitBasicoRemoveEl = document.getElementById("adminKitBasicoRemove");
const kitBasicoHintEl = document.getElementById("adminKitBasicoHint");

const percursoNomeEl = document.getElementById("percursoNome");
const percursoKmEl = document.getElementById("percursoKm");
const percursoMapaUrlEl = document.getElementById("percursoMapaUrl");
const percursoAddEl = document.getElementById("percursoAdd");
const percursoClearEl = document.getElementById("percursoClear");
const percursoListEl = document.getElementById("percursoList");

const descricaoEl = document.getElementById("adminDescricao");
const categoriasEl = document.getElementById("adminCategorias");
const statusEl = document.getElementById("adminStatus");
const formEl = document.getElementById("adminEventoForm");

const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const eventoIdParam = params.get("id");

const percursos = [];

function setPreview(el, value, fallback) {
  if (!el) return;
  const texto = String(value || "").trim();
  el.textContent = texto || fallback;
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message || "";
}

function setImagePreview(previewEl, removeEl, url) {
  if (!previewEl) return;
  if (url) {
    previewEl.src = url;
    previewEl.classList.remove("hidden");
    if (removeEl) removeEl.classList.remove("hidden");
  } else {
    previewEl.src = "";
    previewEl.classList.add("hidden");
    if (removeEl) removeEl.classList.add("hidden");
  }
}

function setImageHint(hintEl, message) {
  if (hintEl) hintEl.textContent = message || "";
}

async function uploadImagemSafe(file) {
  if (typeof window.uploadImagem !== "function") {
    throw new Error("Upload indisponivel. Verifique a configuracao.");
  }
  return window.uploadImagem(file);
}

function wireImagemKit({ urlEl, fileEl, previewEl, removeEl, hintEl, label }) {
  if (fileEl) {
    fileEl.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        setStatus(`Enviando imagem do ${label}...`);
        setImageHint(hintEl, "Enviando...");
        const url = await uploadImagemSafe(file);
        if (urlEl) urlEl.value = url;
        setImagePreview(previewEl, removeEl, url);
        setStatus(`Imagem do ${label} enviada!`);
        setImageHint(hintEl, "Upload concluido.");
      } catch (err) {
        console.error(err);
        setStatus(err?.message || `Erro ao enviar imagem do ${label}`);
        setImageHint(hintEl, "Falha no upload.");
      }
    });
  }

  if (urlEl) {
    urlEl.addEventListener("input", () => {
      const url = urlEl.value.trim();
      if (!url) {
        setImagePreview(previewEl, removeEl, "");
        setImageHint(hintEl, "");
        return;
      }
      setImagePreview(previewEl, removeEl, url);
      setImageHint(hintEl, "Pre-visualizando URL.");
    });
  }

  if (removeEl) {
    removeEl.addEventListener("click", () => {
      if (urlEl) urlEl.value = "";
      if (fileEl) fileEl.value = "";
      setImagePreview(previewEl, removeEl, "");
      setImageHint(hintEl, "Imagem removida.");
    });
  }
}

function atualizarPreviewBasico() {
  setPreview(previewTitulo, tituloEl?.value, "Nome do evento");
  setPreview(previewCidade, cidadeEl?.value, "Nome da cidade");
  setPreview(previewOrganizador, organizadorEl?.value, "Nome organizador");
  const localTexto = [String(localEl?.value || "").trim(), String(enderecoLocalEl?.value || "").trim()]
    .filter(Boolean)
    .join(" - ");
  setPreview(previewLocal, localTexto, "Nome do local");
}

function atualizarPreviewKits() {
  if (!previewKits) return;
  const kits = [];
  if (String(kitCompletoEl?.value || "").trim()) kits.push("Completo");
  if (String(kitEconomicoEl?.value || "").trim()) kits.push("Economico");
  if (String(kitBasicoEl?.value || "").trim()) kits.push("Basico");
  previewKits.textContent = kits.length ? kits.join(", ") : "Completo, Economico, Basico";
}

function renderPercursos() {
  if (!percursoListEl) return;
  if (!percursos.length) {
    percursoListEl.innerHTML = "<p class=\"text-gray-500\">Nenhum percurso cadastrado.</p>";
    if (previewPercursos) previewPercursos.textContent = "Defina os percursos";
    return;
  }

  percursoListEl.innerHTML = percursos
    .map((p, index) => {
      const distancia = p.km ? `${p.km} km` : "";
      const mapa = p.mapa ? `<div class=\"text-xs text-gray-500\">Mapa: ${p.mapa}</div>` : "";
      return `
        <div class="border rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <strong>${p.nome || "Percurso"}</strong>
            <div class="text-xs text-gray-600">${distancia}</div>
            ${mapa}
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
      if (Number.isNaN(index)) return;
      percursos.splice(index, 1);
      renderPercursos();
    });
  });

  const resumo = percursos
    .map((p) => (p.km ? `${p.km}KM` : p.nome || "Percurso"))
    .filter(Boolean)
    .join(", ");
  if (previewPercursos) previewPercursos.textContent = resumo || "Defina os percursos";
}

function adicionarPercurso() {
  const nome = String(percursoNomeEl?.value || "").trim();
  const km = String(percursoKmEl?.value || "").trim();
  const mapa = String(percursoMapaUrlEl?.value || "").trim();

  if (!nome && !km) {
    setStatus("Informe o nome ou a distancia do percurso");
    return;
  }

  percursos.push({ nome, km, mapa });

  if (percursoNomeEl) percursoNomeEl.value = "";
  if (percursoKmEl) percursoKmEl.value = "";
  if (percursoMapaUrlEl) percursoMapaUrlEl.value = "";
  setStatus("");
  renderPercursos();
}

function limparPercursos() {
  percursos.length = 0;
  renderPercursos();
}

function extrairMeta(descricao) {
  const texto = String(descricao || "");
  const index = texto.indexOf(META_MARKER);
  if (index === -1) return { descricaoVisivel: texto, meta: null };
  const descricaoVisivel = texto.slice(0, index).trim();
  const metaRaw = texto.slice(index + META_MARKER.length).trim();
  try {
    return { descricaoVisivel, meta: JSON.parse(metaRaw) };
  } catch (err) {
    console.error("Erro ao ler meta:", err);
    return { descricaoVisivel, meta: null };
  }
}

function montarMeta() {
  const resumo = String(document.getElementById("adminResumo")?.value || "").trim();
  const pcd = String(document.getElementById("adminPcd")?.value || "").trim();

  const dataVendas = String(document.getElementById("adminDataVendas")?.value || "").trim();
  const horario = String(document.getElementById("adminHorario")?.value || "").trim();
  const enderecoLocal = String(document.getElementById("adminEnderecoLocal")?.value || "").trim();
  const cidade = String(cidadeEl?.value || "").trim();

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

  const premiacao = {
    participacao: String(document.getElementById("adminPremiacaoParticipacao")?.value || "").trim(),
    top3Geral: String(document.getElementById("adminPremiacaoTop3Geral")?.value || "").trim(),
    top3Categorias: String(document.getElementById("adminPremiacaoCategorias")?.value || "").trim(),
    equipes: String(document.getElementById("adminPremiacaoEquipes")?.value || "").trim(),
  };

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
    kits: {
      completo: {
        descricao: String(kitCompletoEl?.value || "").trim(),
        imagemUrl: String(kitCompletoUrlEl?.value || "").trim(),
      },
      economico: {
        descricao: String(kitEconomicoEl?.value || "").trim(),
        imagemUrl: String(kitEconomicoUrlEl?.value || "").trim(),
      },
      basico: {
        descricao: String(kitBasicoEl?.value || "").trim(),
        imagemUrl: String(kitBasicoUrlEl?.value || "").trim(),
      },
    },
    entrega,
    programacao,
    premiacao,
    contato,
    links,
  };
}

function montarDescricao() {
  const sections = [];
  const meta = montarMeta();

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

  const kits = [];
  if (meta.kits.completo?.descricao) kits.push(`Kit completo:\n${meta.kits.completo.descricao}`);
  if (meta.kits.economico?.descricao) kits.push(`Kit economico:\n${meta.kits.economico.descricao}`);
  if (meta.kits.basico?.descricao) kits.push(`Kit basico:\n${meta.kits.basico.descricao}`);
  if (kits.length) sections.push(`KITS\n${kits.join("\n\n")}`);

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

  const premiacao = [];
  if (meta.premiacao.participacao) premiacao.push(`Participacao: ${meta.premiacao.participacao}`);
  if (meta.premiacao.top3Geral) premiacao.push(`Top 3 geral: ${meta.premiacao.top3Geral}`);
  if (meta.premiacao.top3Categorias) premiacao.push(`Top 3 categorias: ${meta.premiacao.top3Categorias}`);
  if (meta.premiacao.equipes) premiacao.push(`Equipes: ${meta.premiacao.equipes}`);
  if (premiacao.length) sections.push(`PREMIACAO\n${premiacao.join("\n")}`);

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
  if (descricaoEl) descricaoEl.value = `${descricaoVisivel}${META_MARKER}${JSON.stringify(meta)}`;

  if (categoriasEl) {
    const categorias = meta.percursos
      .map((p) => (p.km ? `${p.km}K` : p.nome))
      .filter(Boolean)
      .join(", ");
    categoriasEl.value = categorias;
  }
}

function aplicarMeta(meta) {
  if (!meta) return;
  if (document.getElementById("adminResumo")) document.getElementById("adminResumo").value = meta.resumo || "";
  if (document.getElementById("adminPcd")) document.getElementById("adminPcd").value = meta.pcd || "";
  if (document.getElementById("adminDataVendas")) document.getElementById("adminDataVendas").value = meta.dataVendas || "";
  if (document.getElementById("adminHorario")) document.getElementById("adminHorario").value = meta.horario || "";
  if (cidadeEl) cidadeEl.value = meta.cidade || cidadeEl.value || "";
  if (document.getElementById("adminEnderecoLocal")) document.getElementById("adminEnderecoLocal").value = meta.enderecoLocal || "";

  if (document.getElementById("adminLargada1Nome")) document.getElementById("adminLargada1Nome").value = meta.largadas?.[0]?.nome || "";
  if (document.getElementById("adminLargada1Endereco")) document.getElementById("adminLargada1Endereco").value = meta.largadas?.[0]?.endereco || "";
  if (document.getElementById("adminLargada1Horario")) document.getElementById("adminLargada1Horario").value = meta.largadas?.[0]?.horario || "";
  if (document.getElementById("adminLargada2Nome")) document.getElementById("adminLargada2Nome").value = meta.largadas?.[1]?.nome || "";
  if (document.getElementById("adminLargada2Endereco")) document.getElementById("adminLargada2Endereco").value = meta.largadas?.[1]?.endereco || "";
  if (document.getElementById("adminLargada2Horario")) document.getElementById("adminLargada2Horario").value = meta.largadas?.[1]?.horario || "";

  if (kitCompletoEl) kitCompletoEl.value = meta.kits?.completo?.descricao || "";
  if (kitEconomicoEl) kitEconomicoEl.value = meta.kits?.economico?.descricao || "";
  if (kitBasicoEl) kitBasicoEl.value = meta.kits?.basico?.descricao || "";

  if (kitCompletoUrlEl) kitCompletoUrlEl.value = meta.kits?.completo?.imagemUrl || "";
  if (kitEconomicoUrlEl) kitEconomicoUrlEl.value = meta.kits?.economico?.imagemUrl || "";
  if (kitBasicoUrlEl) kitBasicoUrlEl.value = meta.kits?.basico?.imagemUrl || "";

  setImagePreview(kitCompletoPreviewEl, kitCompletoRemoveEl, kitCompletoUrlEl?.value);
  setImagePreview(kitEconomicoPreviewEl, kitEconomicoRemoveEl, kitEconomicoUrlEl?.value);
  setImagePreview(kitBasicoPreviewEl, kitBasicoRemoveEl, kitBasicoUrlEl?.value);

  if (document.getElementById("adminEntrega1Data")) document.getElementById("adminEntrega1Data").value = meta.entrega?.itens?.[0]?.data || "";
  if (document.getElementById("adminEntrega1Local")) document.getElementById("adminEntrega1Local").value = meta.entrega?.itens?.[0]?.local || "";
  if (document.getElementById("adminEntrega2Data")) document.getElementById("adminEntrega2Data").value = meta.entrega?.itens?.[1]?.data || "";
  if (document.getElementById("adminEntrega2Local")) document.getElementById("adminEntrega2Local").value = meta.entrega?.itens?.[1]?.local || "";
  if (document.getElementById("adminEntregaObs")) document.getElementById("adminEntregaObs").value = meta.entrega?.observacoes || "";

  if (document.getElementById("adminProg1")) document.getElementById("adminProg1").value = meta.programacao?.[0] || "";
  if (document.getElementById("adminProg2")) document.getElementById("adminProg2").value = meta.programacao?.[1] || "";
  if (document.getElementById("adminProg3")) document.getElementById("adminProg3").value = meta.programacao?.[2] || "";
  if (document.getElementById("adminProg4")) document.getElementById("adminProg4").value = meta.programacao?.[3] || "";
  if (document.getElementById("adminProg5")) document.getElementById("adminProg5").value = meta.programacao?.[4] || "";

  if (document.getElementById("adminPremiacaoParticipacao")) document.getElementById("adminPremiacaoParticipacao").value = meta.premiacao?.participacao || "";
  if (document.getElementById("adminPremiacaoTop3Geral")) document.getElementById("adminPremiacaoTop3Geral").value = meta.premiacao?.top3Geral || "";
  if (document.getElementById("adminPremiacaoCategorias")) document.getElementById("adminPremiacaoCategorias").value = meta.premiacao?.top3Categorias || "";
  if (document.getElementById("adminPremiacaoEquipes")) document.getElementById("adminPremiacaoEquipes").value = meta.premiacao?.equipes || "";

  if (document.getElementById("adminContatoEmail")) document.getElementById("adminContatoEmail").value = meta.contato?.email || "";
  if (document.getElementById("adminContatoWhatsapp")) document.getElementById("adminContatoWhatsapp").value = meta.contato?.whatsapp || "";
  if (document.getElementById("adminContatoInstagram")) document.getElementById("adminContatoInstagram").value = meta.contato?.instagram || "";
  if (document.getElementById("adminContatoSite")) document.getElementById("adminContatoSite").value = meta.contato?.site || "";

  if (document.getElementById("adminLinkArea")) document.getElementById("adminLinkArea").value = meta.links?.area || "";
  if (document.getElementById("adminLinkProtocolo")) document.getElementById("adminLinkProtocolo").value = meta.links?.protocolo || "";
  if (document.getElementById("adminLinkBoleto")) document.getElementById("adminLinkBoleto").value = meta.links?.boleto || "";
  if (document.getElementById("adminLinkOrganizador")) document.getElementById("adminLinkOrganizador").value = meta.links?.organizador || "";

  percursos.length = 0;
  if (Array.isArray(meta.percursos)) {
    meta.percursos.forEach((p) => {
      if (!p) return;
      percursos.push({
        nome: String(p.nome || "").trim(),
        km: String(p.km || "").trim(),
        mapa: String(p.mapa || "").trim(),
      });
    });
  }

  renderPercursos();
  atualizarPreviewBasico();
  atualizarPreviewKits();
}

async function carregarEventoParaEdicao() {
  if (!eventoIdParam || !token) return;
  try {
    setStatus("Carregando evento...");
    const response = await fetch("http://localhost:3000/admin/eventos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Erro ao carregar evento");
      return;
    }
    const evento = data.find((item) => String(item.id) === String(eventoIdParam));
    if (!evento) {
      setStatus("Evento nao encontrado.");
      return;
    }
    if (typeof window.adminSetEditMode === "function") {
      window.adminSetEditMode(evento);
    }
    const { meta } = extrairMeta(evento.descricao || "");
    aplicarMeta(meta);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexao com o servidor");
  }
}

if (tituloEl) tituloEl.addEventListener("input", atualizarPreviewBasico);
if (organizadorEl) organizadorEl.addEventListener("input", atualizarPreviewBasico);
if (cidadeEl) cidadeEl.addEventListener("input", atualizarPreviewBasico);
if (localEl) localEl.addEventListener("input", atualizarPreviewBasico);
if (enderecoLocalEl) enderecoLocalEl.addEventListener("input", atualizarPreviewBasico);

if (kitCompletoEl) kitCompletoEl.addEventListener("input", atualizarPreviewKits);
if (kitEconomicoEl) kitEconomicoEl.addEventListener("input", atualizarPreviewKits);
if (kitBasicoEl) kitBasicoEl.addEventListener("input", atualizarPreviewKits);

if (percursoAddEl) percursoAddEl.addEventListener("click", adicionarPercurso);
if (percursoClearEl) percursoClearEl.addEventListener("click", limparPercursos);

if (formEl) {
  formEl.addEventListener(
    "submit",
    () => {
      montarDescricao();
    },
    true
  );
}

wireImagemKit({
  urlEl: kitCompletoUrlEl,
  fileEl: kitCompletoFileEl,
  previewEl: kitCompletoPreviewEl,
  removeEl: kitCompletoRemoveEl,
  hintEl: kitCompletoHintEl,
  label: "kit completo",
});

wireImagemKit({
  urlEl: kitEconomicoUrlEl,
  fileEl: kitEconomicoFileEl,
  previewEl: kitEconomicoPreviewEl,
  removeEl: kitEconomicoRemoveEl,
  hintEl: kitEconomicoHintEl,
  label: "kit economico",
});

wireImagemKit({
  urlEl: kitBasicoUrlEl,
  fileEl: kitBasicoFileEl,
  previewEl: kitBasicoPreviewEl,
  removeEl: kitBasicoRemoveEl,
  hintEl: kitBasicoHintEl,
  label: "kit basico",
});

atualizarPreviewBasico();
atualizarPreviewKits();
renderPercursos();
carregarEventoParaEdicao();
