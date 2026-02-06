const token = localStorage.getItem("token");

const META_MARKER = "\n\n[[META]]\n";
const gpxStore = [];
const leafletMaps = new WeakMap();

const tituloEl = document.getElementById("eventoTitulo");
const subtituloEl = document.getElementById("eventoSubtitulo");
const dataEl = document.getElementById("eventoData");
const localEl = document.getElementById("eventoLocal");
const organizadorEl = document.getElementById("eventoOrganizador");
const resumoEl = document.getElementById("eventoResumo");

const bannerWrapper = document.getElementById("bannerWrapper");
const bannerEl = document.getElementById("eventoBanner");

const infoGeralEl = document.getElementById("infoGeral");
const infoPcdEl = document.getElementById("infoPcd");
const infoLargadasEl = document.getElementById("infoLargadas");
const infoPercursosEl = document.getElementById("infoPercursos");
const infoKitsEl = document.getElementById("infoKits");
const infoEntregaEl = document.getElementById("infoEntrega");
const infoProgramacaoEl = document.getElementById("infoProgramacao");
const infoPremiacaoEl = document.getElementById("infoPremiacao");
const infoOpcoesEl = document.getElementById("infoOpcoes");
const infoCategoriasEl = document.getElementById("infoCategorias");
const infoContatoEl = document.getElementById("infoContato");
const infoLinksEl = document.getElementById("infoLinks");

const mapaModalEl = document.getElementById("mapaModal");
const mapaModalContentEl = document.getElementById("mapaModalContent");
const mapaModalCloseEl = document.getElementById("mapaModalClose");

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch (err) {
    return value;
  }
}

function formatMoeda(value) {
  const numero = Number(value || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

function stripMeta(descricao) {
  if (!descricao) return "";
  const index = descricao.indexOf(META_MARKER);
  if (index === -1) return descricao.trim();
  return descricao.slice(0, index).trim();
}

function normalizeMapaUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.includes("strava.com/routes/") && !value.includes("/embed")) {
    return `${value.replace(/\/$/, "")}/embed`;
  }
  return value;
}

function parseGpx(gpxText) {
  try {
    const xml = new DOMParser().parseFromString(gpxText, "application/xml");
    if (xml.querySelector("parsererror")) return [];
    const points = Array.from(xml.querySelectorAll("trkpt, rtept")).map((pt) => {
      const lat = Number(pt.getAttribute("lat"));
      const lon = Number(pt.getAttribute("lon"));
      if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
      return [lat, lon];
    });
    return points.filter(Boolean);
  } catch (err) {
    return [];
  }
}

function resetLeafletMap(container) {
  if (!container) return;
  const existing = leafletMaps.get(container);
  if (existing) {
    existing.remove();
    leafletMaps.delete(container);
  }
}

function renderGpxMap(container, gpxText) {
  if (!container || !window.L) return;
  resetLeafletMap(container);
  const points = parseGpx(gpxText);
  if (points.length < 2) {
    container.innerHTML = "<div class=\"p-3 text-xs text-gray-500\">GPX inválido ou vazio.</div>";
    return;
  }
  container.innerHTML = "";
  const map = L.map(container, { scrollWheelZoom: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);
  if (map.attributionControl) {
    map.attributionControl.setPrefix("");
  }
  const polyline = L.polyline(points, { color: "#f97316", weight: 4 }).addTo(map);
  map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
  setTimeout(() => map.invalidateSize(), 50);
  leafletMaps.set(container, map);
}

async function initGpxEmbeds(root) {
  if (!root || !window.L) return;
  const nodes = root.querySelectorAll("[data-gpx-idx], [data-gpx-url]");
  for (const node of nodes) {
    if (node.dataset.mapReady) continue;
    node.dataset.mapReady = "true";
    const gpxUrl = node.dataset.gpxUrl;
    const gpxIdx = node.dataset.gpxIdx;
    if (gpxIdx !== undefined && gpxStore[Number(gpxIdx)]) {
      renderGpxMap(node, gpxStore[Number(gpxIdx)]);
      continue;
    }
    if (gpxUrl) {
      try {
        const response = await fetch(gpxUrl);
        const text = await response.text();
        renderGpxMap(node, text);
      } catch (err) {
        node.innerHTML = "<div class=\"p-3 text-xs text-gray-500\">Não foi possível carregar o GPX.</div>";
      }
    }
  }
}

function renderEmpty(el, message) {
  if (!el) return;
  el.innerHTML = `<p class="text-sm text-gray-500">${message}</p>`;
}

function renderList(el, items) {
  if (!el) return;
  if (!items.length) {
    renderEmpty(el, "Nenhuma informação cadastrada.");
    return;
  }
  el.innerHTML = items.map((item) => `<div>${item}</div>`).join("");
}

async function openMapModal({ url, type, gpxText }) {
  if (!mapaModalEl || !mapaModalContentEl) return;
  if (type === "iframe") {
    mapaModalContentEl.innerHTML = `
      <iframe src="${url}" class="w-full h-[85vh]" frameborder="0" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
    `;
  } else if (type === "gpx") {
    mapaModalContentEl.innerHTML = `<div id="modalGpxMap" class="w-full h-[85vh]"></div>`;
    const container = document.getElementById("modalGpxMap");
    let text = gpxText;
    if (!text && url) {
      try {
        const response = await fetch(url);
        text = await response.text();
      } catch (err) {
        if (container) container.innerHTML = "<div class=\"p-3 text-xs text-gray-500\">Não foi possível carregar o GPX.</div>";
      }
    }
    if (container && text) {
      renderGpxMap(container, text);
    }
  } else {
    mapaModalContentEl.innerHTML = `
      <img src="${url}" class="w-full max-h-[85vh] object-contain bg-transparent" alt="Mapa do percurso">
    `;
  }
  mapaModalEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeMapModal() {
  if (!mapaModalEl || !mapaModalContentEl) return;
  mapaModalEl.classList.add("hidden");
  const leafletContainer = mapaModalContentEl.querySelector(".leaflet-container");
  if (leafletContainer) resetLeafletMap(leafletContainer);
  mapaModalContentEl.innerHTML = "";
  document.body.style.overflow = "";
}

function wireMapModal() {
  if (mapaModalCloseEl) {
    mapaModalCloseEl.addEventListener("click", closeMapModal);
  }
  if (mapaModalEl) {
    mapaModalEl.addEventListener("click", (event) => {
      if (event.target === mapaModalEl) closeMapModal();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMapModal();
  });
  if (infoPercursosEl) {
    infoPercursosEl.addEventListener("click", (event) => {
      const target = event.target;
      const clickable = target?.closest?.("[data-map-image],[data-map-iframe],[data-map-gpx-idx],[data-map-gpx-url]");
      if (!clickable) return;
      const imageUrl = clickable.dataset.mapImage;
      const iframeUrl = clickable.dataset.mapIframe;
      const gpxIdx = clickable.dataset.mapGpxIdx;
      const gpxUrl = clickable.dataset.mapGpxUrl;
      if (imageUrl) {
        openMapModal({ url: imageUrl, type: "image" });
        return;
      }
      if (iframeUrl) {
        openMapModal({ url: iframeUrl, type: "iframe" });
        return;
      }
      if (gpxIdx !== undefined) {
        const text = gpxStore[Number(gpxIdx)];
        openMapModal({ type: "gpx", gpxText: text });
        return;
      }
      if (gpxUrl) openMapModal({ type: "gpx", url: gpxUrl });
    });
  }
}

async function carregarEvento() {
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get("id");

  if (!eventoId) {
    if (tituloEl) tituloEl.textContent = "Evento não encontrado";
    if (subtituloEl) subtituloEl.textContent = "Informe o ID do evento.";
    return;
  }

  if (!token) {
    if (subtituloEl) subtituloEl.textContent = "Você precisa estar logado.";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/admin/eventos/${eventoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const evento = await response.json();

    if (!response.ok) {
      if (tituloEl) tituloEl.textContent = "Erro ao carregar evento";
      if (subtituloEl) subtituloEl.textContent = evento?.error || "Tente novamente.";
      return;
    }

    const meta = evento.meta || extrairMeta(evento.descricao || "") || {};
    const descricaoVisivel = meta.resumo || stripMeta(evento.descricao || "");

    if (tituloEl) tituloEl.textContent = evento.titulo || "Evento";
    if (subtituloEl) {
      subtituloEl.textContent = `${formatDate(evento.dataEvento)} • ${evento.local || "-"}`;
    }
    if (dataEl) dataEl.textContent = `Data: ${formatDate(evento.dataEvento)}`;
    if (localEl) localEl.textContent = `Local: ${evento.local || "-"}`;
    if (organizadorEl) organizadorEl.textContent = `Organizador: ${evento.organizador || "-"}`;
    if (resumoEl) resumoEl.textContent = descricaoVisivel || "Resumo não informado.";

    if (bannerWrapper && bannerEl) {
      if (evento.banner_url) {
        bannerEl.src = evento.banner_url;
        bannerWrapper.classList.remove("hidden");
      } else {
        bannerWrapper.classList.add("hidden");
      }
    }

    const infoGeral = [];
    if (meta.dataVendas) infoGeral.push(`Vendas até: ${meta.dataVendas}`);
    if (meta.horario) infoGeral.push(`Horário: ${meta.horario}`);
    if (meta.cidade) infoGeral.push(`Cidade/UF: ${meta.cidade}`);
    if (meta.enderecoLocal) infoGeral.push(`Endereço principal: ${meta.enderecoLocal}`);
    renderList(infoGeralEl, infoGeral);

    if (infoPcdEl) {
      infoPcdEl.textContent = meta.pcd || "Não informado.";
    }

    const largadas = Array.isArray(meta.largadas) ? meta.largadas : [];
    if (!largadas.length) {
      renderEmpty(infoLargadasEl, "Nenhum ponto de largada cadastrado.");
    } else if (infoLargadasEl) {
      infoLargadasEl.innerHTML = largadas
        .map((largada, index) => {
          if (!largada?.nome && !largada?.endereco && !largada?.horario) return "";
          return `
            <div class="border rounded-xl px-3 py-2">
              <div class="font-semibold">Ponto ${index + 1}: ${largada.nome || "-"}</div>
              <div class="text-xs text-gray-500">${largada.endereco || "-"}</div>
              <div class="text-xs text-gray-500">${largada.horario || "-"}</div>
            </div>
          `;
        })
        .join("");
    }

    const percursos = Array.isArray(meta.percursos) ? meta.percursos : [];
    if (!percursos.length) {
      renderEmpty(infoPercursosEl, "Nenhum percurso cadastrado.");
    } else if (infoPercursosEl) {
      infoPercursosEl.innerHTML = percursos
        .map((percurso) => {
          const partes = [];
          if (percurso?.nome) partes.push(percurso.nome);
          if (percurso?.km) partes.push(`${percurso.km} km`);
          const mapaImagemUrl = percurso?.mapaImagemUrl;
          const mapaUrlRaw = percurso?.mapa || "";
          const mapaUrl = normalizeMapaUrl(mapaUrlRaw);
          const gpxText = percurso?.gpxData || "";
          const gpxUrl = percurso?.gpxUrl || "";
          let gpxIdx = null;
          if (gpxText) {
            gpxStore.push(gpxText);
            gpxIdx = gpxStore.length - 1;
          }
          const gpxIdxAttr = gpxIdx !== null ? `data-gpx-idx="${gpxIdx}"` : "";
          const gpxUrlAttr = gpxIdx !== null ? "" : gpxUrl ? `data-gpx-url="${gpxUrl}"` : "";
          const gpxBtnIdxAttr = gpxIdx !== null ? `data-map-gpx-idx="${gpxIdx}"` : "";
          const gpxBtnUrlAttr = gpxIdx !== null ? "" : gpxUrl ? `data-map-gpx-url="${gpxUrl}"` : "";
          const mapa = mapaImagemUrl
            ? `
              <div class="mt-2">
                <img src="${mapaImagemUrl}" data-map-image="${mapaImagemUrl}" class="w-full max-h-64 object-contain rounded-xl border bg-transparent cursor-zoom-in" alt="Mapa do percurso">
                <div class="text-[11px] text-gray-500 mt-1">Clique para ampliar</div>
              </div>
            `
            : gpxText || gpxUrl
            ? `
              <div class="mt-2">
                <div class="relative w-full h-64 rounded-xl border bg-transparent overflow-hidden">
                  <div class="absolute inset-0 map-embed" ${gpxIdxAttr} ${gpxUrlAttr}></div>
                </div>
                <button ${gpxBtnIdxAttr} ${gpxBtnUrlAttr} class="mt-2 text-xs font-semibold text-blue-700 underline">Ampliar mapa</button>
              </div>
            `
            : mapaUrl
            ? `
              <div class="mt-2">
                <div class="relative w-full aspect-[16/9] rounded-xl border bg-transparent overflow-hidden">
                  <iframe src="${mapaUrl}" class="absolute inset-0 w-full h-full" frameborder="0" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
                </div>
                <button data-map-iframe="${mapaUrl}" class="mt-2 text-xs font-semibold text-blue-700 underline">Ampliar mapa</button>
              </div>
            `
            : "Mapa não informado";
          return `
            <div class="border rounded-xl px-3 py-2">
              <div class="font-semibold">${partes.join(" • ") || "Percurso"}</div>
              <div class="text-xs text-gray-500">${mapa}</div>
            </div>
          `;
        })
        .join("");
      initGpxEmbeds(infoPercursosEl);
    }

    if (infoKitsEl) {
      let kits = [];
      if (Array.isArray(meta.kits)) {
        kits = meta.kits;
      } else if (meta.kits) {
        const map = [
          { key: "completo", label: "Kit completo" },
          { key: "economico", label: "Kit econômico" },
          { key: "basico", label: "Kit básico" },
        ];
        kits = map
          .map((item) => {
            const data = meta.kits?.[item.key];
            if (!data?.descricao && !data?.imagemUrl) return null;
            return { nome: item.label, descricao: data?.descricao, imagemUrl: data?.imagemUrl };
          })
          .filter(Boolean);
      }
      if (!kits.length) {
        renderEmpty(infoKitsEl, "Nenhum kit cadastrado.");
      } else {
        infoKitsEl.innerHTML = kits
          .map((kit) => {
            const titulo = kit?.nome || "Kit";
            const descricao = kit?.descricao || "Não informado.";
            const imagem = kit?.imagemUrl
              ? `<img src="${kit.imagemUrl}" class="w-full h-28 object-contain bg-gray-100 rounded-lg border mb-2" alt="${titulo}">`
              : "";
            return `
              <div class="border rounded-xl p-3">
                <div class="font-semibold mb-2 uppercase">${titulo}</div>
                ${imagem}
                <div class="text-xs text-gray-600 whitespace-pre-line break-words">${descricao}</div>
              </div>
            `;
          })
          .join("");
      }
    }

    const entregaItens = meta.entrega?.itens || [];
    const entrega = entregaItens
      .filter((item) => item?.data || item?.local)
      .map((item, index) => `Entrega ${index + 1}: ${item.data || "-"} • ${item.local || "-"}`);
    if (meta.entrega?.observacoes) entrega.push(`Obs: ${meta.entrega.observacoes}`);
    renderList(infoEntregaEl, entrega);

    const programacao = Array.isArray(meta.programacao) ? meta.programacao : [];
    renderList(infoProgramacaoEl, programacao.map((item) => `• ${item}`));

    if (infoPremiacaoEl) {
      let premiacao = [];
      if (Array.isArray(meta.premiacao)) {
        premiacao = meta.premiacao;
      } else if (meta.premiacao) {
        const map = [
          { key: "participacao", label: "Participação" },
          { key: "top3Geral", label: "Top 3 geral" },
          { key: "top3Categorias", label: "Top 3 categorias" },
          { key: "equipes", label: "Equipes / assessorias" },
        ];
        premiacao = map
          .map((item) => {
            const texto = meta.premiacao?.[item.key];
            if (!texto) return null;
            return { titulo: item.label, descricao: texto };
          })
          .filter(Boolean);
      }
      if (!premiacao.length) {
        renderEmpty(infoPremiacaoEl, "Nenhuma premiação cadastrada.");
      } else {
        infoPremiacaoEl.innerHTML = premiacao
          .map((item) => {
            const titulo = item?.titulo || "Premiação";
            const descricao = item?.descricao || "Não informado.";
            return `
              <div class="border rounded-xl px-3 py-2">
                <div class="font-semibold uppercase">${titulo}</div>
                <div class="text-xs text-gray-600 whitespace-pre-line break-words">${descricao}</div>
              </div>
            `;
          })
          .join("");
      }
    }

    if (infoOpcoesEl) {
      const opcoes = Array.isArray(evento.opcoes) ? evento.opcoes : [];
      if (!opcoes.length) {
        renderEmpty(infoOpcoesEl, "Nenhuma opção cadastrada.");
      } else {
        infoOpcoesEl.innerHTML = opcoes
          .map((opcao) => {
            const taxaValor = (Number(opcao.preco || 0) * Number(opcao.taxa_percentual || 0)) / 100;
            const total = Number(opcao.preco || 0) + taxaValor;
            return `
              <div class="border rounded-xl px-3 py-2">
                <div class="font-semibold">${opcao.titulo}</div>
                <div class="text-xs text-gray-500">${opcao.tipo} • ${opcao.distancia_km} km</div>
                <div class="text-xs text-gray-600">
                  ${formatMoeda(opcao.preco)} + ${formatMoeda(taxaValor)} taxa = ${formatMoeda(total)}
                </div>
              </div>
            `;
          })
          .join("");
      }
    }

    if (infoCategoriasEl) {
      const categorias = Array.isArray(evento.categorias) ? evento.categorias : [];
      if (!categorias.length) {
        renderEmpty(infoCategoriasEl, "Sem categorias.");
      } else {
        infoCategoriasEl.innerHTML = categorias
          .map((categoria) => `<span class="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">${categoria.nome}</span>`)
          .join("");
      }
    }

    const contato = [];
    if (meta.contato?.email) contato.push(`Email: ${meta.contato.email}`);
    if (meta.contato?.whatsapp) contato.push(`WhatsApp: ${meta.contato.whatsapp}`);
    if (meta.contato?.instagram) contato.push(`Instagram: ${meta.contato.instagram}`);
    if (meta.contato?.site) contato.push(`Site: ${meta.contato.site}`);
    renderList(infoContatoEl, contato);

    const links = [];
    if (meta.links?.area) links.push(`Área do participante: ${meta.links.area}`);
    if (meta.links?.protocolo) links.push(`Protocolo: ${meta.links.protocolo}`);
    if (meta.links?.boleto) links.push(`2ª via boleto: ${meta.links.boleto}`);
    if (meta.links?.organizador) links.push(`Falar com organizador: ${meta.links.organizador}`);
    renderList(infoLinksEl, links);
  } catch (err) {
    if (tituloEl) tituloEl.textContent = "Erro de conexão";
    if (subtituloEl) subtituloEl.textContent = "Não foi possível carregar o evento.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  wireMapModal();
  carregarEvento();
});




