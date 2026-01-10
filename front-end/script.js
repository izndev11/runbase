 function abrirCadastro() {
        // Esconde o card de login
        document.getElementById('loginCard').style.display = 'none';
        // Mostra o card de cadastro
        document.getElementById('cadastroModal').style.display = 'block';
    }

    function fecharCadastro() {
        // Esconde o card de cadastro
        document.getElementById('cadastroModal').style.display = 'none';
        // Mostra o card de login novamente
        document.getElementById('loginCard').style.display = 'block';
    }

    // Função para carregar estados do IBGE ao abrir a página
window.onload = function() {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(response => response.json())
        .then(data => {
            const estadoSelect = document.getElementById('estado');
            data.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado.sigla;
                option.text = estado.nome;
                estadoSelect.appendChild(option);
            });
        });
};

// Função para carregar cidades quando o estado mudar
function carregarCidades() {
    const estadoSigla = document.getElementById('estado').value;
    const cidadeSelect = document.getElementById('cidade');
    
    cidadeSelect.innerHTML = '<option value="">Carregando...</option>';

    if (!estadoSigla) {
        cidadeSelect.innerHTML = '<option value="">Selecione o Estado primeiro</option>';
        return;
    }

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSigla}/municipios`)
        .then(response => response.json())
        .then(data => {
            cidadeSelect.innerHTML = '<option value="">Selecione a Cidade</option>';
            data.forEach(cidade => {
                const option = document.createElement('option');
                option.value = cidade.nome;
                option.text = cidade.nome;
                cidadeSelect.appendChild(option);
            });
        });
}