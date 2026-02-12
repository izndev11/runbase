const statusEl = document.getElementById("inscricaoStatus");
const confirmarEl = document.getElementById("inscricaoConfirmar");
const cupomEl = document.getElementById("inscricaoCupom");
const cupomBtnEl = document.getElementById("inscricaoCupomBtn");
const camisetaEl = document.getElementById("inscricaoCamiseta");
const regulamentoEl = document.getElementById("inscricaoRegulamento");
const emergenciaEl = document.getElementById("inscricaoEmergencia");
const equipeEl = document.getElementById("inscricaoEquipe");

const eventoNomeEl = document.getElementById("inscricaoEventoNome");
const eventoDataEl = document.getElementById("inscricaoEventoData");
const participanteNomeEl = document.getElementById("inscricaoParticipanteNome");
const participanteMetaEl = document.getElementById("inscricaoParticipanteMeta");
const opcoesEl = document.getElementById("inscricaoOpcoes");
const totalEl = document.getElementById("inscricaoTotal");
const pixBoxEl = document.getElementById("inscricaoPixBox");
const pixChaveEl = document.getElementById("inscricaoPixChave");
const pixTipoEl = document.getElementById("inscricaoPixTipo");
const pixBeneficiarioEl = document.getElementById("inscricaoPixBeneficiario");
const pixValorEl = document.getElementById("inscricaoPixValor");
const pixCopiarEl = document.getElementById("inscricaoPixCopiar");

const params = new URLSearchParams(window.location.search);
const eventoId = params.get("id");
const opcaoId = params.get("opcao");

let eventoAtual = null;
let opcaoAtual = null;
let totalSelecionado = null;

async function carregarPerfil() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch("http://localhost:3000/usuarios/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) return;
    if (participanteNomeEl) participanteNomeEl.textContent = data.nome_completo || "Participante";
    const nascimento = data.data_nascimento ? formatDate(data.data_nascimento) : "--/--/----";
    const cpf = data.cpf ? data.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.***.***-$4") : "---";
    const sexo = normalizarSexo(data.sexo);
    if (participanteMetaEl) {
      participanteMetaEl.textContent = `${nascimento} - ${sexo} - doc.: ${cpf}`;
    }
  } catch (err) {
    console.error(err);
  }
}

function normalizarSexo(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "--";
  const lower = texto.toLowerCase();
  if (lower === "masculino" || lower === "m") return "M";
  if (lower === "feminino" || lower === "f") return "F";
  if (lower === "outro" || lower === "o") return "O";
  if (lower === "prefiro nao informar" || lower === "prefiro não informar" || lower === "n") return "N";
  return texto.toUpperCase();
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message || "";
}

function parseDateValue(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  const isoPart = text.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
    const [year, month, day] = isoPart.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [day, month, year] = text.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDate(value) {
  if (!value) return "-";
  const date = parseDateValue(value);
  if (!date) return String(value);
  return date.toLocaleDateString("pt-BR");
}

function formatMoeda(value) {
  const numero = Number(value || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderOpcoes(opcoes) {
  if (!opcoesEl) return;
  opcoesEl.innerHTML = "";
  if (!opcoes || !opcoes.length) {
    opcoesEl.innerHTML = "<p class=\"text-sm text-gray-500\">Nenhuma opção disponível.</p>";
    if (totalEl) totalEl.textContent = "-";
    return;
  }

  opcoes.forEach((opcao) => {
    const taxa = (opcao.preco * opcao.taxa_percentual) / 100;
    const total = opcao.preco + taxa;
    const card = document.createElement("label");
    card.className = "block border rounded-xl px-4 py-3 bg-white shadow-sm cursor-pointer";
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <input type="radio" name="inscricaoOpcao" value="${opcao.id}" class="mt-1">
        <div class="flex-1">
          <div class="font-bold">${opcao.titulo}</div>
          <div class="text-xs text-gray-500">${opcao.tipo} â€¢ ${opcao.distancia_km} km</div>
          <div class="text-sm text-blue-700 mt-1">
            ${formatMoeda(opcao.preco)} + ${formatMoeda(taxa)} taxa (${opcao.taxa_percentual}%)
          </div>
        </div>
        <div class="text-sm font-bold text-gray-700">${formatMoeda(total)}</div>
      </div>
    `;
    const radio = card.querySelector("input");
    if (String(opcaoAtual?.id) === String(opcao.id)) {
      radio.checked = true;
      if (totalEl) totalEl.textContent = formatMoeda(total);
    }
    radio.addEventListener("change", () => {
      opcaoAtual = opcao;
      totalSelecionado = total;
      if (totalEl) totalEl.textContent = formatMoeda(total);
      setStatus("");
      validarConfirmacao();
    });
    opcoesEl.appendChild(card);
  });
}

function renderPixManual(pix) {
  if (!pixBoxEl || !pix) return;
  pixChaveEl.textContent = pix.chave || "-";
  pixTipoEl.textContent = pix.tipo || "-";
  pixBeneficiarioEl.textContent = pix.beneficiario || "-";
  pixValorEl.textContent = formatMoeda(pix.valor);
  pixBoxEl.classList.remove("hidden");
}

async function copiarChavePix() {
  const chave = String(pixChaveEl?.textContent || "").trim();
  if (!chave) return;
  try {
    await navigator.clipboard.writeText(chave);
    setStatus("Chave Pix copiada.");
  } catch (err) {
    console.error(err);
    setStatus("Não foi possível copiar a chave. Copie manualmente.");
  }
}

async function carregarEvento() {
  if (!eventoId) {
    setStatus("Evento nao encontrado. Abra esta tela pelo fluxo da corrida.");
    if (confirmarEl) confirmarEl.disabled = true;
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/eventos");
    const eventos = await response.json();
    if (!response.ok) {
      setStatus(eventos.error || "Erro ao carregar evento");
      return;
    }

    eventoAtual = eventos.find((item) => String(item.id) === String(eventoId));
    if (!eventoAtual) {
      setStatus("Evento nao encontrado.");
      return;
    }

    const opcoes = Array.isArray(eventoAtual.opcoes) ? eventoAtual.opcoes : [];
    const opcaoParamValida =
      opcaoId && opcaoId !== "null" && opcaoId !== "undefined" ? opcaoId : null;

    opcaoAtual = opcaoParamValida
      ? opcoes.find((o) => String(o.id) === String(opcaoParamValida)) || null
      : null;

    if (!opcaoAtual && opcoes.length) {
      opcaoAtual = opcoes[0];
    }

    if (eventoNomeEl) eventoNomeEl.textContent = eventoAtual.titulo || "Evento";
    if (eventoDataEl) eventoDataEl.textContent = formatDate(eventoAtual.dataEvento);

    const preco = opcaoAtual?.preco || 0;
    const taxa = (preco * (opcaoAtual?.taxa_percentual || 0)) / 100;
    totalSelecionado = opcaoAtual ? preco + taxa : null;
    renderOpcoes(eventoAtual.opcoes);
    if (totalEl) {
      totalEl.textContent = totalSelecionado ? formatMoeda(totalSelecionado) : "-";
    }
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexao com o servidor");
  }
}

function validarConfirmacao() {
  if (!confirmarEl) return;
  const regulamentoOk = regulamentoEl?.value ? true : false;
  const emergenciaOk = true;
  const equipeOk = true;
  const camisetaOk = Boolean(camisetaEl?.value);
  const opcaoOk = Boolean(opcaoAtual?.id);
  confirmarEl.disabled = !(regulamentoOk && camisetaOk && opcaoOk);
  if (confirmarEl.disabled) {
    const faltando = [];
    if (!opcaoOk) faltando.push("opção da corrida");
    if (!camisetaOk) faltando.push("tamanho da camiseta");
    if (!regulamentoOk) faltando.push("regulamento");
    if (pixBoxEl?.classList.contains("hidden")) {
      setStatus(`Falta selecionar: ${faltando.join(", ")}.`);
    }
  }
}

async function inscrever() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  if (!eventoId) {
    setStatus("Evento nao encontrado. Volte para a pagina da corrida.");
    return;
  }
  if (!opcaoAtual?.id) {
    setStatus("Selecione uma opcao da corrida.");
    return;
  }

  if (!camisetaEl?.value) {
    setStatus("Selecione o tamanho da camiseta.");
    return;
  }

  try {
    setStatus("Criando inscricao...");
    if (confirmarEl) confirmarEl.disabled = true;

    let inscricaoId = null;

    const resposta = await fetch("http://localhost:3000/api/inscricoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventoId: Number(eventoId), opcaoId: opcaoAtual.id }),
    });
    const data = await resposta.json();
    if (resposta.ok) {
      inscricaoId = data.id;
    } else {
      const jaInscrito = String(data?.error || "").toLowerCase().includes("já inscrito");
      if (!jaInscrito) {
        throw new Error(data?.error || "Erro ao inscrever");
      }
      const minhas = await fetch("http://localhost:3000/api/inscricoes/minhas", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json());
      const existente = Array.isArray(minhas)
        ? minhas.find((i) => String(i.eventoId) === String(eventoId))
        : null;
      inscricaoId = existente?.id || null;
    }

    if (!inscricaoId) {
      throw new Error("Não foi possível identificar sua inscrição.");
    }

    setStatus("Criando pagamento Pix...");
    const pagamentoResp = await fetch("http://localhost:3000/pagamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        inscricaoId,
        metodo: "PIX_MANUAL",
        opcaoId: opcaoAtual?.id,
      }),
    });
    const pagamento = await pagamentoResp.json();
    if (!pagamentoResp.ok) {
      throw new Error(pagamento?.error || "Erro ao gerar pagamento");
    }

    if (pagamento.pix_error) {
      if (pagamento.pix) renderPixManual(pagamento.pix);
      setStatus(pagamento.pix_error);
    } else if (pagamento.pix) {
      renderPixManual(pagamento.pix);
      setStatus("Pagamento criado. Copie a chave Pix para finalizar.");
    } else {
      setStatus("Pagamento criado. Verifique os dados do Pix.");
    }
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Erro de conexao com o servidor");
  } finally {
    validarConfirmacao();
  }
}

if (camisetaEl) {
  camisetaEl.addEventListener("change", validarConfirmacao);
}

if (regulamentoEl) {
  regulamentoEl.addEventListener("change", validarConfirmacao);
}

if (emergenciaEl) {
  emergenciaEl.addEventListener("input", validarConfirmacao);
}

if (equipeEl) {
  equipeEl.addEventListener("input", validarConfirmacao);
}

if (confirmarEl) {
  confirmarEl.addEventListener("click", inscrever);
}

if (cupomBtnEl) {
  cupomBtnEl.addEventListener("click", () => {
    const cupom = String(cupomEl?.value || "").trim();
    if (!cupom) {
      setStatus("Informe um cupom para aplicar.");
      return;
    }
    setStatus(`Cupom "${cupom}" aplicado (exemplo).`);
  });
}

if (pixCopiarEl) {
  pixCopiarEl.addEventListener("click", copiarChavePix);
}

carregarEvento();
carregarPerfil();
validarConfirmacao();

