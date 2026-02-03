console.log("AUTH.JS CARREGADO");

function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", login);
}

async function login(event) {
  event.preventDefault();
  console.log("LOGIN DISPARADO");

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!email || !senha) {
    alert("Preencha email e senha");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao fazer login");
      return;
    }

    localStorage.setItem("token", data.token);

    alert("Login realizado com sucesso!");
    // window.location.href = "eventos.html";
  } catch (err) {
    console.error(err);
    alert("Erro de conexÃ£o com o servidor");
  }
}

document.addEventListener("DOMContentLoaded", bindLoginForm);
