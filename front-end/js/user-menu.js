const userMenuButton = document.getElementById("userMenuButton");
const userMenuDropdown = document.getElementById("userMenuDropdown");
const userMenuName = document.getElementById("userMenuName");
const userMenuLogout = document.getElementById("userMenuLogout");
const userMenuContainer = document.getElementById("userMenuContainer");
const loginLink = document.getElementById("loginLink");
const userMenuAdmin = document.getElementById("userMenuAdmin");
const userMenuProfile = document.getElementById("userMenuProfile");

function getRoleFromToken(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(json);
    return data?.role || null;
  } catch (err) {
    return null;
  }
}

function applyRole(role) {
  if (!userMenuAdmin && !userMenuProfile) return;
  if (userMenuAdmin) {
    if (role === "ADMIN") userMenuAdmin.classList.remove("hidden");
    else userMenuAdmin.classList.add("hidden");
  }
  if (userMenuProfile) {
    if (role === "ADMIN") userMenuProfile.classList.add("hidden");
    else userMenuProfile.classList.remove("hidden");
  }
}

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
  const storedRole = localStorage.getItem("role");
  const tokenRole = getRoleFromToken(token);
  applyRole(storedRole || tokenRole);

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
    if (data.role) {
      localStorage.setItem("role", data.role);
      applyRole(data.role);
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
      localStorage.removeItem("role");
      window.location.href = "login.html";
    });
  }
  document.addEventListener("click", closeMenuIfOutside);
  loadUserMenu();
}

document.addEventListener("DOMContentLoaded", setupUserMenu);



