const tituloEl = document.getElementById("corridaTitulo");
const dataEl = document.getElementById("corridaData");
const localEl = document.getElementById("corridaLocal");
const orgEl = document.getElementById("corridaOrganizador");
const descEl = document.getElementById("corridaDescricao");
const categoriasEl = document.getElementById("corridaCategorias");
const bannerEl = document.getElementById("corridaBanner");
const statusEl = document.getElementById("corridaStatus");
const inscreverBtn = document.getElementById("corridaInscrever");

const params = new URLSearchParams(window.location.search);
const eventoId = params.get("id");

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
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
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
  }
}

async function inscrever() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (!eventoId) return;

  try {
    if (inscreverBtn) inscreverBtn.disabled = true;
    setStatus("Criando inscrição...");

    const response = await fetch("http://localhost:3000/api/inscricoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventoId: Number(eventoId) }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = data?.error || "Erro ao inscrever";
      setStatus(errorMessage);
      if (inscreverBtn) inscreverBtn.disabled = false;
      return;
    }

    setStatus("Inscrição realizada com sucesso!");
    if (inscreverBtn) {
      inscreverBtn.textContent = "INSCRITO";
      inscreverBtn.disabled = true;
      inscreverBtn.classList.add("opacity-60", "cursor-not-allowed");
    }
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexão com o servidor");
    if (inscreverBtn) inscreverBtn.disabled = false;
  }
}

if (inscreverBtn) {
  inscreverBtn.addEventListener("click", inscrever);
}

carregarEvento();


