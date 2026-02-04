console.log("CADASTRO.JS CARREGADO");

function bindCadastroForm() {
  const form = document.getElementById("cadastroForm");
  if (!form) return;
  form.addEventListener("submit", cadastrar);
}

async function cadastrar(event) {
  event.preventDefault();

  const nomeBase = document.getElementById("cadastro_nome").value.trim();
  const sobrenomeEl = document.getElementById("cadastro_sobrenome");
  const sobrenome = sobrenomeEl ? sobrenomeEl.value.trim() : "";
  const nome_completo = sobrenome ? `${nomeBase} ${sobrenome}` : nomeBase;
  const email = document.getElementById("cadastro_email").value;
  const cpf = document.getElementById("cadastro_cpf").value;
  const data_nascimento = document.getElementById("cadastro_nascimento").value;
  const telefone = document.getElementById("cadastro_telefone").value;
  const sexo = document.getElementById("cadastro_sexo").value;
  const cidade =
    document.getElementById("cidade")?.value ||
    document.getElementById("cadastro_cidade")?.value ||
    "";
  const estado =
    document.getElementById("estado")?.value ||
    document.getElementById("cadastro_estado")?.value ||
    "";
  const senha = document.getElementById("cadastro_senha").value;

  if (
    !nome_completo ||
    !email ||
    !cpf ||
    !data_nascimento ||
    !telefone ||
    !sexo ||
    !cidade ||
    !estado ||
    !senha
  ) {
    alert("Preencha todos os campos do cadastro");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome_completo,
        email,
        cpf,
        data_nascimento,
        telefone,
        sexo,
        cidade,
        estado,
        senha,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao criar usuário");
      return;
    }

    alert("Cadastro realizado! Faça login para continuar.");
    fecharCadastro();
  } catch (err) {
    console.error(err);
    alert("Erro de conexão com o servidor");
  }
}

document.addEventListener("DOMContentLoaded", bindCadastroForm);


