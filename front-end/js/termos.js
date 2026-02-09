const params = new URLSearchParams(window.location.search);
const eventoId = params.get("id");
const opcaoId = params.get("opcao");

const checkEl = document.getElementById("termosCheck");
const continuarEl = document.getElementById("termosContinuar");
const voltarEl = document.getElementById("termosVoltar");

function atualizarBotao() {
  if (!continuarEl) return;
  continuarEl.disabled = !checkEl?.checked;
}

if (checkEl) {
  checkEl.addEventListener("change", atualizarBotao);
}

if (continuarEl) {
  continuarEl.addEventListener("click", () => {
    if (!eventoId) {
      window.location.href = "corrida.html";
      return;
    }
    const destino = opcaoId
      ? `inscricao.html?id=${encodeURIComponent(eventoId)}&opcao=${encodeURIComponent(opcaoId)}`
      : `inscricao.html?id=${encodeURIComponent(eventoId)}`;
    window.location.href = destino;
  });
}

if (voltarEl) {
  voltarEl.addEventListener("click", () => {
    if (!eventoId) {
      window.location.href = "corrida.html";
      return;
    }
    window.location.href = `corrida.html?id=${encodeURIComponent(eventoId)}`;
  });
}

atualizarBotao();
