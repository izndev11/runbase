async function requireAdmin() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/usuarios/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok || data.role !== "ADMIN") {
      window.location.href = "index.html";
    }
  } catch (err) {
    console.error(err);
    window.location.href = "index.html";
  }
}

document.addEventListener("DOMContentLoaded", requireAdmin);


