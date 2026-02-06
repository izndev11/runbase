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
const debugEl = document.getElementById("adminDebug");
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

function setDebug(message) {
  if (debugEl) debugEl.textContent = message || "";
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

function setImagemPrincipalPreview(url) {
  const preview = document.getElementById("adminImagemPreview");
  const removeBtn = document.getElementById("adminImagemRemove");
  const hint = document.getElementById("adminImagemHint");
  if (!preview) return;
  if (url) {
    preview.src = url;
    preview.classList.remove("hidden");
    if (removeBtn) removeBtn.classList.remove("hidden");
    if (hint) hint.textContent = "Imagem atual carregada.";
  } else {
    preview.src = "";
    preview.classList.add("hidden");
    if (removeBtn) removeBtn.classList.add("hidden");
    if (hint) hint.textContent = "";
  }
}

function setBannerPrincipalPreview(url) {
  const preview = document.getElementById("adminBannerPreview");
  const removeBtn = document.getElementById("adminBannerRemove");
  const hint = document.getElementById("adminBannerHint");
  if (!preview) return;
  if (url) {
    preview.src = url;
    preview.classList.remove("hidden");
    if (removeBtn) removeBtn.classList.remove("hidden");
    if (hint) hint.textContent = "Banner atual carregado.";
  } else {
    preview.src = "";
    preview.classList.add("hidden");
    if (removeBtn) removeBtn.classList.add("hidden");
    if (hint) hint.textContent = "";
  }
}

function preencherBasico(evento) {
  if (tituloEl) tituloEl.value = evento.titulo || "";
  const dataEl = document.getElementById("adminData");
  if (dataEl) {
    dataEl.value = evento.dataEvento
      ? new Date(evento.dataEvento).toISOString().slice(0, 10)
      : "";
  }
  if (localEl) localEl.value = evento.local || "";
  if (organizadorEl) organizadorEl.value = evento.organizador || "";

  const imagemUrlEl = document.getElementById("adminImagemUrl");
  const bannerUrlEl = document.getElementById("adminBannerUrl");
  if (imagemUrlEl) imagemUrlEl.value = evento.imagem_url || "";
  if (bannerUrlEl) bannerUrlEl.value = evento.banner_url || "";
  setImagemPrincipalPreview(evento.imagem_url || "");
  setBannerPrincipalPreview(evento.banner_url || "");

  const descricaoHidden = document.getElementById("adminDescricao");
  if (descricaoHidden) descricaoHidden.value = evento.descricao || "";
  const categoriasHidden = document.getElementById("adminCategorias");
  if (categoriasHidden) {
    const categoriasTexto = Array.isArray(evento.categorias)
      ? evento.categorias.map((c) => c.nome).join(", ")
      : "";
    categoriasHidden.value = categoriasTexto;
  }

  const editId = document.getElementById("adminEventoId");
  if (editId) editId.value = String(evento.id || "");

  if (typeof window.adminSetOpcoes === "function") {
    window.adminSetOpcoes(
      Array.isArray(evento.opcoes)
        ? evento.opcoes.map((o) => ({
            titulo: o.titulo,
            tipo: o.tipo,
            distancia_km: Number(o.distancia_km),
            preco: Number(o.preco),
            taxa_percentual: Number(o.taxa_percentual ?? 0),
          }))
        : []
    );
  }
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
  window.__percursosFallback = [...percursos];

  if (percursoNomeEl) percursoNomeEl.value = "";
  if (percursoKmEl) percursoKmEl.value = "";
  if (percursoMapaUrlEl) percursoMapaUrlEl.value = "";
  setStatus("");
  renderPercursos();
}

function limparPercursos() {
  percursos.length = 0;
  window.__percursosFallback = [];
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
    percursos: Array.isArray(window.__percursosFallback) && window.__percursosFallback.length
      ? [...window.__percursosFallback]
      : [...percursos],
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
    window.__percursosFallback = meta.percursos.map((p) => ({
      nome: String(p?.nome || "").trim(),
      km: String(p?.km || "").trim(),
      mapa: String(p?.mapa || "").trim(),
    }));
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
  if (!eventoIdParam) return;
  try {
    setStatus("Carregando evento...");
    setDebug(`Iniciando com id=${eventoIdParam}`);

    try {
      const rawCache = localStorage.getItem("eventosMetaCache");
      if (rawCache) {
        const cache = JSON.parse(rawCache);
        const item = cache?.[String(eventoIdParam)];
        if (item?.descricao || item?.meta) {
          const dataBasica = {
            id: Number(eventoIdParam),
            descricao: item.descricao || null,
          };
          preencherBasico(dataBasica);
          if (item.meta) aplicarMeta(item.meta);
        }
      }
    } catch (err) {
      console.warn("Falha ao ler cache local:", err);
    }

    const tentarFetch = async (url, headers) => {
      const response = await fetch(url, headers ? { headers } : undefined);
      let data = null;
      try {
        data = await response.json();
      } catch (err) {
        data = null;
      }
      return { response, data };
    };

    const aplicarEvento = (data) => {
      if (!data) return false;
      preencherBasico(data);
      if (typeof window.adminSetEditMode === "function") {
        window.adminSetEditMode(data);
      }
      const { meta, descricaoVisivel } = extrairMeta(data.descricao || "");
      if (meta || data?.meta) {
        aplicarMeta(data?.meta || meta);
      } else if (descricaoVisivel) {
        const resumoEl = document.getElementById("adminResumo");
        if (resumoEl) resumoEl.value = descricaoVisivel;
      }
      setStatus("");
      return true;
    };

    if (token) {
      setDebug(`Buscando /admin/eventos/${eventoIdParam}`);
      const { response, data } = await tentarFetch(
        `http://localhost:3000/admin/eventos/${encodeURIComponent(eventoIdParam)}`,
        { Authorization: `Bearer ${token}` }
      );
      if (response.ok && aplicarEvento(data)) {
        setDebug("OK /admin/eventos/:id");
        return;
      }
      setDebug(`Falhou /admin/eventos/:id (${response.status})`);
    }

    {
      setDebug(`Buscando /eventos/${eventoIdParam}`);
      const { response, data } = await tentarFetch(
        `http://localhost:3000/eventos/${encodeURIComponent(eventoIdParam)}`
      );
      if (response.ok && aplicarEvento(data)) {
        setDebug("OK /eventos/:id");
        return;
      }
      setDebug(`Falhou /eventos/:id (${response.status})`);
    }

    if (token) {
      setDebug("Buscando lista /admin/eventos");
      const { response, data } = await tentarFetch(
        "http://localhost:3000/admin/eventos",
        { Authorization: `Bearer ${token}` }
      );
      if (response.ok && Array.isArray(data)) {
        const encontrado = data.find((item) => String(item?.id) === String(eventoIdParam));
        if (aplicarEvento(encontrado)) {
          setDebug("OK /admin/eventos (lista)");
          return;
        }
      }
    }

    {
      setDebug("Buscando lista /eventos");
      const { response, data } = await tentarFetch("http://localhost:3000/eventos");
      if (response.ok && Array.isArray(data)) {
        const encontrado = data.find((item) => String(item?.id) === String(eventoIdParam));
        if (aplicarEvento(encontrado)) {
          setDebug("OK /eventos (lista)");
          return;
        }
      }
    }

    setStatus("Evento nao encontrado.");
    setDebug("Nenhuma rota retornou evento.");
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexao com o servidor");
    setDebug("Erro no JS/servidor.");
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

document.addEventListener("click", (event) => {
  const addBtn = event.target?.closest("#percursoAdd");
  if (addBtn) {
    event.preventDefault();
    adicionarPercurso();
    return;
  }
  const clearBtn = event.target?.closest("#percursoClear");
  if (clearBtn) {
    event.preventDefault();
    limparPercursos();
  }
});

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

window.adminAdicionarPercurso = adicionarPercurso;
window.adminLimparPercursos = limparPercursos;
window.adminRenderPercursos = renderPercursos;
window.adminBuildMeta = montarMeta;
window.adminSyncDescricao = montarDescricao;
