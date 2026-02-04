const userMenuButton = document.getElementById("userMenuButton");
const userMenuDropdown = document.getElementById("userMenuDropdown");
const userMenuName = document.getElementById("userMenuName");
const userMenuLogout = document.getElementById("userMenuLogout");
const userMenuContainer = document.getElementById("userMenuContainer");
const loginLink = document.getElementById("loginLink");
const userMenuAdmin = document.getElementById("userMenuAdmin");

function toggleMenu() {
  if (!userMenuDropdown) return;
  const isHidden = userMenuDropdown.classList.contains("hidden");
  if (isHidden) userMenuDropdown.classList.remove("hidden");
  else userMenuDropdown.classList.add("hidden");
}

function closeMenuIfOutside(event) {
  if (!userMenuDropdown || !userMenuButton) return;
  if (userMenuDropdown.contains(event.target)) return;
  if (userMenuButton.contains(event.target)) return;
  userMenuDropdown.classList.add("hidden");
}

async function loadUserMenu() {
  const token = localStorage.getItem("token");
  if (!token) {
    if (userMenuContainer) userMenuContainer.classList.add("hidden");
    if (loginLink) loginLink.classList.remove("hidden");
    return;
  }
  if (loginLink) loginLink.classList.add("hidden");
  if (userMenuContainer) userMenuContainer.classList.remove("hidden");

  try {
    const response = await fetch("http://localhost:3000/usuarios/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) return;

    if (userMenuName) {
      userMenuName.textContent = `Olá, ${data.nome_completo || "Usuário"}`;
    }
    if (userMenuAdmin) {
      if (data.role === "ADMIN") userMenuAdmin.classList.remove("hidden");
      else userMenuAdmin.classList.add("hidden");
    }
  } catch (err) {
    console.error(err);
  }
}

function setupUserMenu() {
  if (userMenuButton) userMenuButton.addEventListener("click", toggleMenu);
  if (userMenuLogout) {
    userMenuLogout.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }
  document.addEventListener("click", closeMenuIfOutside);
  loadUserMenu();
}

document.addEventListener("DOMContentLoaded", setupUserMenu);


