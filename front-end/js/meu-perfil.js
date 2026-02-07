const token = localStorage.getItem("token");

const statusEl = document.getElementById("perfilStatus");
const eventosStatusEl = document.getElementById("perfilEventosStatus");
const eventosListEl = document.getElementById("perfilEventosList");

const avatarEl = document.getElementById("perfilAvatar");
const avatarPlaceholderEl = document.getElementById("perfilAvatarPlaceholder");
const avatarInputEl = document.getElementById("perfilAvatarInput");
const avatarRemoveEl = document.getElementById("perfilAvatarRemove");
const avatarCropModalEl = document.getElementById("avatarCropModal");
const avatarCropCloseEl = document.getElementById("avatarCropClose");
const avatarCropCancelEl = document.getElementById("avatarCropCancel");
const avatarCropSaveEl = document.getElementById("avatarCropSave");
const avatarCropCanvasEl = document.getElementById("avatarCropCanvas");
const avatarCropZoomEl = document.getElementById("avatarCropZoom");

const equipeNomeEl = document.getElementById("perfilEquipeNome");
const equipeFuncaoEl = document.getElementById("perfilEquipeFuncao");
const equipeObsEl = document.getElementById("perfilEquipeObs");
const salvarBtn = document.getElementById("perfilSalvar");
const salvarStatusEl = document.getElementById("perfilSalvarStatus");

const AVATAR_KEY = "perfilAvatar";
const EQUIPE_NOME_KEY = "perfilEquipeNome";
const EQUIPE_FUNCAO_KEY = "perfilEquipeFuncao";
const EQUIPE_OBS_KEY = "perfilEquipeObs";

const cropState = {
  image: null,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  offsetX: 0,
  offsetY: 0,
  baseScale: 1,
};

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
      openCropModal(result);
    }
  };
  reader.readAsDataURL(file);
}

function openCropModal(dataUrl) {
  if (!avatarCropModalEl || !avatarCropCanvasEl) return;
  const img = new Image();
  img.onload = () => {
    cropState.image = img;
    cropState.dragging = false;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    if (avatarCropZoomEl) avatarCropZoomEl.value = "1";
    recalcularBaseScale();
    desenharCrop();
    avatarCropModalEl.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  img.src = dataUrl;
}

function closeCropModal() {
  if (!avatarCropModalEl) return;
  avatarCropModalEl.classList.add("hidden");
  document.body.style.overflow = "";
  cropState.image = null;
}

function recalcularBaseScale() {
  if (!avatarCropCanvasEl || !cropState.image) return;
  const canvasSize = avatarCropCanvasEl.width;
  const scale = Math.max(
    canvasSize / cropState.image.width,
    canvasSize / cropState.image.height
  );
  cropState.baseScale = scale;
}

function getZoom() {
  const raw = avatarCropZoomEl ? Number(avatarCropZoomEl.value) : 1;
  if (!raw || Number.isNaN(raw)) return 1;
  return raw;
}

function clampOffsets() {
  if (!avatarCropCanvasEl || !cropState.image) return;
  const canvasSize = avatarCropCanvasEl.width;
  const scale = cropState.baseScale * getZoom();
  const drawW = cropState.image.width * scale;
  const drawH = cropState.image.height * scale;
  const minX = Math.min(0, canvasSize - drawW);
  const minY = Math.min(0, canvasSize - drawH);
  cropState.offsetX = Math.min(0, Math.max(cropState.offsetX, minX));
  cropState.offsetY = Math.min(0, Math.max(cropState.offsetY, minY));
}

function desenharCrop() {
  if (!avatarCropCanvasEl || !cropState.image) return;
  const ctx = avatarCropCanvasEl.getContext("2d");
  if (!ctx) return;
  const canvasSize = avatarCropCanvasEl.width;
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  const scale = cropState.baseScale * getZoom();
  const drawW = cropState.image.width * scale;
  const drawH = cropState.image.height * scale;
  clampOffsets();
  ctx.drawImage(cropState.image, cropState.offsetX, cropState.offsetY, drawW, drawH);
}

function startDrag(event) {
  if (!cropState.image) return;
  cropState.dragging = true;
  cropState.dragStartX = event.clientX;
  cropState.dragStartY = event.clientY;
}

function moveDrag(event) {
  if (!cropState.dragging) return;
  const dx = event.clientX - cropState.dragStartX;
  const dy = event.clientY - cropState.dragStartY;
  cropState.dragStartX = event.clientX;
  cropState.dragStartY = event.clientY;
  cropState.offsetX += dx;
  cropState.offsetY += dy;
  desenharCrop();
}

function endDrag() {
  cropState.dragging = false;
}

function bindCropEvents() {
  if (!avatarCropCanvasEl) return;
  avatarCropCanvasEl.addEventListener("pointerdown", startDrag);
  avatarCropCanvasEl.addEventListener("pointermove", moveDrag);
  avatarCropCanvasEl.addEventListener("pointerup", endDrag);
  avatarCropCanvasEl.addEventListener("pointerleave", endDrag);

  if (avatarCropZoomEl) {
    avatarCropZoomEl.addEventListener("input", desenharCrop);
  }

  if (avatarCropCloseEl) avatarCropCloseEl.addEventListener("click", closeCropModal);
  if (avatarCropCancelEl) avatarCropCancelEl.addEventListener("click", closeCropModal);
  if (avatarCropModalEl) {
    avatarCropModalEl.addEventListener("click", (event) => {
      if (event.target === avatarCropModalEl) closeCropModal();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCropModal();
  });

  if (avatarCropSaveEl) {
    avatarCropSaveEl.addEventListener("click", () => {
      if (!avatarCropCanvasEl) return;
      const dataUrl = avatarCropCanvasEl.toDataURL("image/jpeg", 0.92);
      localStorage.setItem(AVATAR_KEY, dataUrl);
      updateAvatar(dataUrl);
      setStatus("Foto atualizada.");
      closeCropModal();
    });
  }
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
    const da = parseDateValue(a.evento?.dataEvento)?.getTime() ?? 0;
    const db = parseDateValue(b.evento?.dataEvento)?.getTime() ?? 0;
    return db - da;
  });

  ordenadas.forEach((inscricao) => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const dataFmt = formatDate(inscricao.evento?.dataEvento);

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
  bindCropEvents();
}

document.addEventListener("DOMContentLoaded", setupProfile);
