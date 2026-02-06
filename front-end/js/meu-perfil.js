const token = localStorage.getItem("token");

const statusEl = document.getElementById("perfilStatus");
const eventosStatusEl = document.getElementById("perfilEventosStatus");
const eventosListEl = document.getElementById("perfilEventosList");

const avatarEl = document.getElementById("perfilAvatar");
const avatarPlaceholderEl = document.getElementById("perfilAvatarPlaceholder");
const avatarInputEl = document.getElementById("perfilAvatarInput");
const avatarRemoveEl = document.getElementById("perfilAvatarRemove");

const equipeNomeEl = document.getElementById("perfilEquipeNome");
const equipeFuncaoEl = document.getElementById("perfilEquipeFuncao");
const equipeObsEl = document.getElementById("perfilEquipeObs");
const salvarBtn = document.getElementById("perfilSalvar");
const salvarStatusEl = document.getElementById("perfilSalvarStatus");

const AVATAR_KEY = "perfilAvatar";
const EQUIPE_NOME_KEY = "perfilEquipeNome";
const EQUIPE_FUNCAO_KEY = "perfilEquipeFuncao";
const EQUIPE_OBS_KEY = "perfilEquipeObs";

function setStatus(message) {
  if (statusEl) statusEl.textContent = message || "";
}

function setSalvarStatus(message) {
  if (salvarStatusEl) salvarStatusEl.textContent = message || "";
}

function setField(id, value, fallback = "-") {
  const el = document.getElementById(id);
  if (!el) return;
  const text = String(value || "").trim();
  el.textContent = text || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch (err) {
    return value;
  }
}

function maskCpf(value) {
  const cpf = String(value || "").replace(/\D/g, "");
  if (cpf.length !== 11) return value || "-";
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.***.***-$4");
}

function updateAvatar(src) {
  if (avatarEl) {
    avatarEl.src = src;
    avatarEl.classList.remove("hidden");
  }
  if (avatarPlaceholderEl) avatarPlaceholderEl.classList.add("hidden");
  if (avatarRemoveEl) avatarRemoveEl.classList.remove("hidden");
}

function clearAvatar() {
  localStorage.removeItem(AVATAR_KEY);
  if (avatarEl) {
    avatarEl.src = "";
    avatarEl.classList.add("hidden");
  }
  if (avatarPlaceholderEl) avatarPlaceholderEl.classList.remove("hidden");
  if (avatarRemoveEl) avatarRemoveEl.classList.add("hidden");
  setStatus("Foto removida.");
}

function loadLocalProfile() {
  const avatar = localStorage.getItem(AVATAR_KEY);
  if (avatar) updateAvatar(avatar);
  if (equipeNomeEl) equipeNomeEl.value = localStorage.getItem(EQUIPE_NOME_KEY) || "";
  if (equipeFuncaoEl) equipeFuncaoEl.value = localStorage.getItem(EQUIPE_FUNCAO_KEY) || "";
  if (equipeObsEl) equipeObsEl.value = localStorage.getItem(EQUIPE_OBS_KEY) || "";
}

function saveLocalProfile() {
  if (equipeNomeEl) localStorage.setItem(EQUIPE_NOME_KEY, equipeNomeEl.value.trim());
  if (equipeFuncaoEl) localStorage.setItem(EQUIPE_FUNCAO_KEY, equipeFuncaoEl.value.trim());
  if (equipeObsEl) localStorage.setItem(EQUIPE_OBS_KEY, equipeObsEl.value.trim());
  setSalvarStatus("Dados salvos neste navegador.");
}

function handleAvatarChange() {
  const file = avatarInputEl?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Selecione uma imagem valida.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setStatus("Imagem muito grande. Use ate 2MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (typeof result === "string") {
      localStorage.setItem(AVATAR_KEY, result);
      updateAvatar(result);
      setStatus("Foto atualizada.");
    }
  };
  reader.readAsDataURL(file);
}

async function carregarUsuario() {
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  setStatus("Carregando perfil...");
  try {
    const response = await fetch("http://localhost:3000/usuarios/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data?.error || "Nao foi possivel carregar o perfil.");
      return;
    }

    if (data.role === "ADMIN") {
      window.location.href = "admin.html";
      return;
    }

    setField("perfilNome", data.nome_completo);
    setField("perfilEmail", data.email);
    setField("perfilCpf", maskCpf(data.cpf));
    setField("perfilNascimento", formatDate(data.data_nascimento));
    setField("perfilTelefone", data.telefone);
    setField("perfilSexo", data.sexo || "-");
    setField("perfilCidade", data.cidade);
    setField("perfilEstado", data.estado);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Erro de conexao com o servidor.");
  }
}

function renderEventos(inscricoes) {
  if (!eventosListEl) return;
  eventosListEl.innerHTML = "";

  if (!inscricoes.length) {
    eventosListEl.innerHTML = "<p class=\"text-sm text-gray-500\">Voce ainda nao possui eventos.</p>";
    return;
  }

  const ordenadas = [...inscricoes].sort((a, b) => {
    const da = a.evento?.dataEvento ? new Date(a.evento.dataEvento).getTime() : 0;
    const db = b.evento?.dataEvento ? new Date(b.evento.dataEvento).getTime() : 0;
    return db - da;
  });

  ordenadas.forEach((inscricao) => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const dataFmt = inscricao.evento?.dataEvento
      ? new Date(inscricao.evento.dataEvento).toLocaleDateString("pt-BR")
      : "-";

    const imagem =
      inscricao.evento?.imagem_url || inscricao.evento?.imagem || "img/fundo1.png";
    const organizador =
      inscricao.evento?.organizador || inscricao.evento?.organizacao || "SpeedRun";
    const detalhesUrl = inscricao.evento?.id
      ? `corrida-completa.html?id=${inscricao.evento.id}`
      : "#";

    card.innerHTML = `
      <div class="ticket-card__media">
        <a href="${detalhesUrl}">
          <img src="${imagem}" alt="${inscricao.evento?.titulo || "Evento"}" class="ticket-card__image" />
        </a>
        <button type="button" class="ticket-card__fav" aria-label="Favoritar">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <div class="ticket-card__body">
        <div class="ticket-card__status-wrap">
          <span class="ticket-card__status">Status: ${inscricao.status || "-"}</span>
        </div>
        <a href="${detalhesUrl}" class="ticket-card__title" title="${inscricao.evento?.titulo || "Evento"}">
          ${inscricao.evento?.titulo || "Evento"}
        </a>
        <div class="ticket-card__meta">
          <div class="ticket-card__row">
            <i class="fa-solid fa-flag"></i>
            <span>${organizador}</span>
          </div>
          <div class="ticket-card__row">
            <i class="fa-regular fa-calendar"></i>
            <span>${dataFmt}</span>
          </div>
          <div class="ticket-card__row">
            <i class="fa-solid fa-location-dot"></i>
            <span>${inscricao.evento?.local || "-"}</span>
          </div>
        </div>
        <div class="ticket-card__actions">
          <a href="${detalhesUrl}" class="ticket-card__btn ticket-card__btn--light">
            Ver detalhes
          </a>
        </div>
      </div>
    `;

    eventosListEl.appendChild(card);
  });
}

async function carregarEventos() {
  if (!eventosStatusEl) return;
  eventosStatusEl.textContent = "Carregando eventos...";
  try {
    const response = await fetch("http://localhost:3000/api/inscricoes/minhas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const inscricoes = await response.json();

    if (!response.ok) {
      eventosStatusEl.textContent = inscricoes.error || "Erro ao carregar eventos.";
      return;
    }

    eventosStatusEl.textContent = "";
    renderEventos(inscricoes);
  } catch (err) {
    console.error(err);
    eventosStatusEl.textContent = "Erro de conexao com o servidor.";
  }
}

function setupProfile() {
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  loadLocalProfile();
  carregarUsuario();
  carregarEventos();

  if (avatarInputEl) avatarInputEl.addEventListener("change", handleAvatarChange);
  if (avatarRemoveEl) avatarRemoveEl.addEventListener("click", clearAvatar);
  if (salvarBtn) salvarBtn.addEventListener("click", saveLocalProfile);
}

document.addEventListener("DOMContentLoaded", setupProfile);
