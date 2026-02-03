const token = localStorage.getItem("token");

if (!token) {
  alert("FaÃ§a login primeiro");
  window.location.href = "login.html";
}

async function carregarEventos() {
  const response = await fetch("http://localhost:3000/eventos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const eventos = await response.json();
  console.log(eventos);
}

carregarEventos();
