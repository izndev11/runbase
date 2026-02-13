const API_BASE_URL = window.__API_BASE_URL__ || "http://localhost:3000";

function abrirCadastro() {
  document.getElementById("loginCard").style.display = "none";
  document.getElementById("cadastroModal").style.display = "flex";
}

function fecharCadastro() {
  document.getElementById("cadastroModal").style.display = "none";
  document.getElementById("loginCard").style.display = "block";
}

window.onload = function () {
  fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
    .then((response) => response.json())
    .then((data) => {
      const estadoSelect = document.getElementById("estado");
      data.forEach((estado) => {
        const option = document.createElement("option");
        option.value = estado.sigla;
        option.text = estado.nome;
        estadoSelect.appendChild(option);
      });
    });
};

function carregarCidades() {
  const estadoSigla = document.getElementById("estado").value;
  const cidadeSelect = document.getElementById("cidade");

  cidadeSelect.innerHTML = '<option value="">Carregando...</option>';

  if (!estadoSigla) {
    cidadeSelect.innerHTML = '<option value="">Selecione o Estado primeiro</option>';
    return;
  }

  fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSigla}/municipios`)
    .then((response) => response.json())
    .then((data) => {
      cidadeSelect.innerHTML = '<option value="">Selecione a Cidade</option>';
      data.forEach((cidade) => {
        const option = document.createElement("option");
        option.value = cidade.nome;
        option.text = cidade.nome;
        cidadeSelect.appendChild(option);
      });
    });
}

fetch(`${API_BASE_URL}/eventos`)
  .then((res) => res.json())
  .then((dados) => console.log("Conexao bem sucedida! Corridas:", dados))
  .catch((err) =>
    console.error("O front ainda nao ve o back. Verifique se o servidor esta rodando.", err)
  );
