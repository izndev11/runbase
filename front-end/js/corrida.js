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

const params = new URLSearchParams(window.location.search);
const eventoId = params.get("id");

let eventoAtual = null;
let opcaoSelecionadaId = null;
let totalSelecionado = null;

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function irParaTermos() {
  if (!opcaoSelecionadaId) {
    setStatus("Selecione uma opcao antes de continuar.");
    return;
  }
  if (!eventoId) return;
  const destino = `termos.html?id=${encodeURIComponent(eventoId)}&opcao=${encodeURIComponent(opcaoSelecionadaId)}`;
  window.location.href = destino;
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
    pill.className =
      "bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold";
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

async function carregarEvento() {
  if (!eventoId) {
    setStatus("Evento não encontrado.");
    return;
  }

  setStatus("Carregando evento...");
  try {
    const response = await fetch("http://localhost:3000/eventos");
    const eventos = await response.json();

    if (!response.ok) {
      setStatus(eventos.error || "Erro ao carregar evento");
      return;
    }

    const evento = eventos.find((item) => String(item.id) === String(eventoId));

    if (!evento) {
      setStatus("Evento não encontrado.");
      return;
    }

    eventoAtual = evento;

    if (tituloEl) tituloEl.textContent = evento.titulo || "Corrida";
    if (dataEl) dataEl.textContent = formatDate(evento.dataEvento);
    if (localEl) localEl.textContent = evento.local || "-";
    if (orgEl) orgEl.textContent = evento.organizador || evento.organizacao || "SpeedRun";

    const banner = evento.banner_url || "img/fundo1.png";
    if (bannerEl) {
      bannerEl.src = banner;
    }

    if (descEl) {
      descEl.textContent =
        evento.descricao ||
        "Tudo o que você precisa saber antes de se inscrever. Em breve, mais informações sobre percursos, categorias e regulamento.";
    }

    renderCategorias(evento.categorias);
    renderOpcoes(evento.opcoes);
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
  inscreverBtn.addEventListener("click", irParaTermos);
}

carregarEvento();
