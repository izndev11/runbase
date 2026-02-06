const tituloEl = document.getElementById("corridaTitulo");
const dataEl = document.getElementById("corridaData");
const localEl = document.getElementById("corridaLocal");
const orgEl = document.getElementById("corridaOrganizador");
const descEl = document.getElementById("corridaDescricao");
const categoriasEl = document.getElementById("corridaCategorias");
const bannerEl = document.getElementById("corridaBanner");
const statusEl = document.getElementById("corridaStatus");
const inscreverBtn = document.getElementById("corridaInscrever");
const opcoesEl = document.getElementById("corridaOpcoes");
const totalEl = document.getElementById("corridaTotal");
const pixBoxEl = document.getElementById("corridaPixBox");
const pixQrEl = document.getElementById("corridaPixQr");
const pixCodeEl = document.getElementById("corridaPixCode");
const pixLinkEl = document.getElementById("corridaPixLink");
const detalhesEl = document.getElementById("corridaDetalhesAll");

const params = new URLSearchParams(window.location.search);
const eventoId = params.get("id");

let eventoAtual = null;
let opcaoSelecionadaId = null;
let totalSelecionado = null;

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatMoeda(value) {
  const numero = Number(value || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderCategorias(categorias) {
  if (!categoriasEl) return;
  categoriasEl.innerHTML = "";
  if (!categorias || !categorias.length) {
    categoriasEl.innerHTML = "<span class=\"text-gray-500\">Sem categorias</span>";
    return;
  }
  categorias.forEach((cat) => {
    const pill = document.createElement("span");
    pill.className = "bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold";
    pill.textContent = cat.nome || String(cat);
    categoriasEl.appendChild(pill);
  });
}

function renderOpcoes(opcoes) {
  if (!opcoesEl) return;
  opcoesEl.innerHTML = "";
  if (!opcoes || !opcoes.length) {
    opcoesEl.innerHTML = "<p class=\"text-sm text-gray-500\">Nenhuma opção disponível.</p>";
    if (totalEl) totalEl.textContent = "—";
    return;
  }

  opcoes.forEach((opcao) => {
    const taxa = (opcao.preco * opcao.taxa_percentual) / 100;
    const total = opcao.preco + taxa;
    const card = document.createElement("label");
    card.className = "block border rounded-xl px-4 py-3 bg-white shadow-sm cursor-pointer";
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <input type="radio" name="corridaOpcao" value="${opcao.id}" class="mt-1">
        <div class="flex-1">
          <div class="font-bold">${opcao.titulo}</div>
          <div class="text-xs text-gray-500">${opcao.tipo} • ${opcao.distancia_km} km</div>
          <div class="text-sm text-blue-700 mt-1">
            ${formatMoeda(opcao.preco)} + ${formatMoeda(taxa)} taxa (${opcao.taxa_percentual}%)
          </div>
        </div>
        <div class="text-sm font-bold text-gray-700">${formatMoeda(total)}</div>
      </div>
    `;
    const radio = card.querySelector("input");
    radio.addEventListener("change", () => {
      opcaoSelecionadaId = opcao.id;
      totalSelecionado = total;
      if (totalEl) totalEl.textContent = formatMoeda(totalSelecionado);
      setStatus("");
    });
    opcoesEl.appendChild(card);
  });
}

function extrairDescricaoVisivel(descricao) {
  if (!descricao) return "";
  const marker = "\n\n[[META]]\n";
  const index = descricao.indexOf(marker);
  if (index === -1) return descricao;
  return descricao.slice(0, index).trim();
}

function extrairMeta(descricao) {
  if (!descricao) return null;
  const marker = "\n\n[[META]]\n";
  const index = descricao.indexOf(marker);
  if (index === -1) return null;
  const raw = descricao.slice(index + marker.length).trim();
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao ler meta:", err);
    return null;
  }
}

function carregarMetaCache(eventoId) {
  try {
    const raw = localStorage.getItem("eventosMetaCache");
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const item = cache?.[String(eventoId)];
    return item?.meta || null;
  } catch (err) {
    console.warn("Falha ao ler cache local:", err);
    return null;
  }
}

function carregarDescricaoCache(eventoId) {
  try {
    const raw = localStorage.getItem("eventosMetaCache");
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const item = cache?.[String(eventoId)];
    return item?.descricao || null;
  } catch (err) {
    console.warn("Falha ao ler cache local:", err);
    return null;
  }
}

function card(title, body) {
  return `
    <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h4 class="text-sm font-bold text-gray-800 mb-2">${title}</h4>
      ${body}
    </div>
  `;
}

function renderMeta(meta) {
  if (!detalhesEl) return;
  if (!meta) {
    detalhesEl.innerHTML = "";
    return;
  }

  const sections = [];

  if (meta.resumo) {
    sections.push(card("Resumo", `<p class="text-sm text-gray-600 leading-relaxed">${meta.resumo}</p>`));
  }
  if (meta.pcd) {
    sections.push(card("Informações PCD", `<p class="text-sm text-gray-600 leading-relaxed">${meta.pcd}</p>`));
  }

  const infoGeral = [];
  if (meta.dataVendas) infoGeral.push(`Vendas até: ${meta.dataVendas}`);
  if (meta.horario) infoGeral.push(`Horário: ${meta.horario}`);
  if (meta.cidade) infoGeral.push(`Cidade/UF: ${meta.cidade}`);
  if (meta.enderecoLocal) infoGeral.push(`Endereço principal: ${meta.enderecoLocal}`);
  if (infoGeral.length) {
    sections.push(card("Info geral", `<ul class="text-sm text-gray-600 list-disc pl-4">${infoGeral.map((item) => `<li>${item}</li>`).join("")}</ul>`));
  }

  if (Array.isArray(meta.largadas) && meta.largadas.length) {
    const linhas = meta.largadas
      .map((largada, index) => {
        if (!largada?.nome && !largada?.endereco && !largada?.horario) return "";
        const numero = index + 1;
        const partes = [];
        if (largada.nome) partes.push(`Ponto ${numero}: ${largada.nome}`);
        if (largada.endereco) partes.push(`Endereço: ${largada.endereco}`);
        if (largada.horario) partes.push(`Horário: ${largada.horario}`);
        return `<li>${partes.join(" | ")}</li>`;
      })
      .filter(Boolean);
    if (linhas.length) {
      sections.push(card("Largadas", `<ul class="text-sm text-gray-600 list-disc pl-4">${linhas.join("")}</ul>`));
    }
  }

  if (Array.isArray(meta.percursos) && meta.percursos.length) {
    const linhas = meta.percursos
      .map((p) => {
        const partes = [];
        if (p.nome) partes.push(p.nome);
        if (p.km) partes.push(`${p.km} km`);
        if (p.mapa) partes.push(`Mapa: ${p.mapa}`);
        return `<li>${partes.join(" | ")}</li>`;
      })
      .filter(Boolean);
    if (linhas.length) {
      sections.push(card("Percursos", `<ul class="text-sm text-gray-600 list-disc pl-4">${linhas.join("")}</ul>`));
    }
  }

  if (meta.kits) {
    const kits = [
      { label: "Kit completo", descricao: meta.kits.completo?.descricao, imagem: meta.kits.completo?.imagemUrl },
      { label: "Kit economico", descricao: meta.kits.economico?.descricao, imagem: meta.kits.economico?.imagemUrl },
      { label: "Kit basico", descricao: meta.kits.basico?.descricao, imagem: meta.kits.basico?.imagemUrl },
    ].filter((k) => k.descricao || k.imagem);
    if (kits.length) {
      sections.push(
        card(
          "Kits",
          kits
            .map(
              (k) => `
              <div class="mb-3">
                <div class="text-sm font-semibold text-gray-800">${k.label}</div>
                ${k.descricao ? `<div class="text-sm text-gray-600">${k.descricao}</div>` : ""}
                ${k.imagem ? `<img src="${k.imagem}" alt="${k.label}" class="mt-2 w-full h-40 object-cover rounded-lg border">` : ""}
              </div>
            `
            )
            .join("")
        )
      );
    }
  }

  if (meta.entrega) {
    const linhas = [];
    if (Array.isArray(meta.entrega.itens)) {
      meta.entrega.itens.forEach((item, index) => {
        if (!item?.data && !item?.local) return;
        linhas.push(`Entrega ${index + 1}: ${item.data || "-"} - ${item.local || "-"}`);
      });
    }
    if (meta.entrega.observacoes) linhas.push(`Obs: ${meta.entrega.observacoes}`);
    if (linhas.length) {
      sections.push(card("Entrega de kits", `<ul class="text-sm text-gray-600 list-disc pl-4">${linhas.map((item) => `<li>${item}</li>`).join("")}</ul>`));
    }
  }

  if (Array.isArray(meta.programacao) && meta.programacao.length) {
    sections.push(card("Programação", `<ul class="text-sm text-gray-600 list-disc pl-4">${meta.programacao.map((item) => `<li>${item}</li>`).join("")}</ul>`));
  }

  if (meta.premiacao) {
    const linhas = [];
    if (meta.premiacao.participacao) linhas.push(`Participação: ${meta.premiacao.participacao}`);
    if (meta.premiacao.top3Geral) linhas.push(`Top 3 geral: ${meta.premiacao.top3Geral}`);
    if (meta.premiacao.top3Categorias) linhas.push(`Top 3 categorias: ${meta.premiacao.top3Categorias}`);
    if (meta.premiacao.equipes) linhas.push(`Equipes: ${meta.premiacao.equipes}`);
    if (linhas.length) {
      sections.push(card("Premiação", `<ul class="text-sm text-gray-600 list-disc pl-4">${linhas.map((item) => `<li>${item}</li>`).join("")}</ul>`));
    }
  }

  if (meta.contato) {
    const linhas = [];
    if (meta.contato.email) linhas.push(`Email: ${meta.contato.email}`);
    if (meta.contato.whatsapp) linhas.push(`WhatsApp: ${meta.contato.whatsapp}`);
    if (meta.contato.instagram) linhas.push(`Instagram: ${meta.contato.instagram}`);
    if (meta.contato.site) linhas.push(`Site: ${meta.contato.site}`);
    if (linhas.length) {
      sections.push(card("Contato", `<ul class="text-sm text-gray-600 list-disc pl-4">${linhas.map((item) => `<li>${item}</li>`).join("")}</ul>`));
    }
  }

  if (meta.links) {
    const linhas = [];
    if (meta.links.area) linhas.push(`Área do participante: ${meta.links.area}`);
    if (meta.links.protocolo) linhas.push(`Protocolo: ${meta.links.protocolo}`);
    if (meta.links.boleto) linhas.push(`2a via boleto: ${meta.links.boleto}`);
    if (meta.links.organizador) linhas.push(`Falar com organizador: ${meta.links.organizador}`);
    if (linhas.length) {
      sections.push(card("Links", `<ul class="text-sm text-gray-600 list-disc pl-4">${linhas.map((item) => `<li>${item}</li>`).join("")}</ul>`));
    }
  }

  detalhesEl.innerHTML = sections.join("");
}

async function carregarEvento() {
  if (!eventoId) {
    setStatus("Evento não encontrado.");
    return;
  }

  setStatus("Carregando evento...");
  try {
    let evento = null;
    let response = await fetch(`http://localhost:3000/eventos/${encodeURIComponent(eventoId)}`);
    let data = await response.json();
    if (response.ok && data) {
      evento = data;
    } else {
      response = await fetch("http://localhost:3000/eventos");
      data = await response.json();
      if (!response.ok) {
        setStatus(data.error || "Erro ao carregar evento");
        return;
      }
      evento = data.find((item) => String(item.id) === String(eventoId));
    }

    if (!evento) {
      setStatus("Evento não encontrado.");
      return;
    }

    eventoAtual = evento;

    if (tituloEl) tituloEl.textContent = evento.titulo || "Evento";
    if (dataEl) dataEl.textContent = formatDate(evento.dataEvento);
    if (localEl) localEl.textContent = evento.local || "-";
    if (orgEl) orgEl.textContent = evento.organizador || evento.organizacao || "SpeedRun";

    const banner = evento.banner_url || "img/fundo1.png";
    if (bannerEl) bannerEl.src = banner;

    if (descEl) {
      const descricaoVisivel = extrairDescricaoVisivel(evento.descricao || "");
      const descricaoCache = carregarDescricaoCache(eventoId);
      const fallbackDescricao = descricaoCache ? extrairDescricaoVisivel(descricaoCache) : "";
      descEl.textContent =
        descricaoVisivel ||
        fallbackDescricao ||
        "Tudo o que você precisa saber antes de se inscrever. Em breve, mais informações sobre percursos, categorias e regulamento.";
    }

    renderCategorias(evento.categorias);
    renderOpcoes(evento.opcoes);
    const meta = evento.meta || extrairMeta(evento.descricao || "") || carregarMetaCache(eventoId);
    renderMeta(meta);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

async function garantirInscricao(token) {
  const minhas = await fetch("http://localhost:3000/api/inscricoes/minhas", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());
  const existente = minhas.find((i) => String(i.eventoId) === String(eventoId));
  if (existente) return existente.id;

  const resposta = await fetch("http://localhost:3000/api/inscricoes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventoId: Number(eventoId), opcaoId: opcaoSelecionadaId }),
  });
  const data = await resposta.json();
  if (!resposta.ok) {
    throw new Error(data?.error || "Erro ao inscrever");
  }
  return data.id;
}

async function inscrever() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (!eventoId) return;

  if (!opcaoSelecionadaId) {
    setStatus("Selecione uma opção antes de continuar.");
    return;
  }

  try {
    if (inscreverBtn) inscreverBtn.disabled = true;
    setStatus("Criando inscrição...");

    const inscricaoId = await garantirInscricao(token);

    setStatus("Criando pagamento...");
    const pagamentoResp = await fetch("http://localhost:3000/pagamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        inscricaoId,
        metodo: "PIX",
        opcaoId: opcaoSelecionadaId,
      }),
    });
    const pagamentoData = await pagamentoResp.json();
    if (!pagamentoResp.ok) {
      throw new Error(pagamentoData?.error || "Erro ao criar pagamento");
    }

    if (pagamentoData?.pix?.pix_qr_code_base64) {
      if (pixQrEl) {
        pixQrEl.src = `data:image/png;base64,${pagamentoData.pix.pix_qr_code_base64}`;
      }
      if (pixCodeEl) pixCodeEl.textContent = pagamentoData.pix.pix_qr_code || "";
      if (pixLinkEl) {
        pixLinkEl.href = pagamentoData.pix.ticket_url || "#";
      }
      if (pixBoxEl) pixBoxEl.classList.remove("hidden");
      setStatus("Pix gerado. Use o QR Code para pagar (sandbox).");
    } else {
      setStatus("Pagamento criado. Aguarde a confirmação.");
    }
    if (inscreverBtn) {
      inscreverBtn.textContent = "AGUARDANDO PAGAMENTO";
      inscreverBtn.disabled = true;
      inscreverBtn.classList.add("opacity-60", "cursor-not-allowed");
    }
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Erro de conexão com o servidor");
    if (inscreverBtn) inscreverBtn.disabled = false;
  }
}

if (inscreverBtn) {
  inscreverBtn.addEventListener("click", inscrever);
}

carregarEvento();
