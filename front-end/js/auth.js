console.log("AUTH.JS CARREGADO");
window.API_BASE_URL = window.__API_BASE_URL__ || "http://localhost:3000";

function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", login);
}

async function login(event) {
  event.preventDefault();
  console.log("LOGIN DISPARADO");

  const email = document.getElementById("email").value.trim().toLowerCase();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Preencha email e senha");
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
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
    if (data.role) localStorage.setItem("role", data.role);

    alert("Login realizado com sucesso!");
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    alert("Erro de conexão com o servidor");
  }
}

document.addEventListener("DOMContentLoaded", bindLoginForm);
