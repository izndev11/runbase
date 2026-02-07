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

async function carregarEvento() {
  if (!eventoId) {
    setStatus("Evento nao encontrado.");
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

    opcaoAtual = Array.isArray(eventoAtual.opcoes)
      ? eventoAtual.opcoes.find((o) => String(o.id) === String(opcaoId))
      : null;

    if (!opcaoAtual && Array.isArray(eventoAtual.opcoes)) {
      opcaoAtual = eventoAtual.opcoes[0] || null;
    }

    if (eventoNomeEl) eventoNomeEl.textContent = eventoAtual.titulo || "Evento";
    if (eventoDataEl) eventoDataEl.textContent = formatDate(eventoAtual.dataEvento);

    const preco = opcaoAtual?.preco || 0;
    const taxa = (preco * (opcaoAtual?.taxa_percentual || 0)) / 100;
    totalSelecionado = preco + taxa;
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexao com o servidor");
  }
}

function validarConfirmacao() {
  if (!confirmarEl) return;
  const regulamentoOk = regulamentoEl?.value === "SIM";
  const emergenciaOk = Boolean(String(emergenciaEl?.value || "").trim());
  const equipeOk = Boolean(String(equipeEl?.value || "").trim());
  const camisetaOk = Boolean(camisetaEl?.value);
  confirmarEl.disabled = !(regulamentoOk && emergenciaOk && equipeOk && camisetaOk);
}

async function inscrever() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  if (!eventoId || !opcaoAtual?.id) return;

  if (!camisetaEl?.value) {
    setStatus("Selecione o tamanho da camiseta.");
    return;
  }

  try {
    setStatus("Criando inscricao...");
    if (confirmarEl) confirmarEl.disabled = true;

    const resposta = await fetch("http://localhost:3000/api/inscricoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventoId: Number(eventoId), opcaoId: opcaoAtual.id }),
    });
    const data = await resposta.json();
    if (!resposta.ok) {
      throw new Error(data?.error || "Erro ao inscrever");
    }

    setStatus("Inscricao criada. Gere o pagamento na pagina do evento.");
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

carregarEvento();
carregarPerfil();
validarConfirmacao();
