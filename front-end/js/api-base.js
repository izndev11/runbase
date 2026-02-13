(() => {
  const PROD_API = "https://runbase.onrender.com";

  window.__API_BASE_URL__ = window.__API_BASE_URL__ || PROD_API;
  window.API_BASE_URL = window.__API_BASE_URL__;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("http://localhost:3000")) {
      input = input.replace("http://localhost:3000", window.API_BASE_URL);
    }
    return originalFetch(input, init);
  };
})();
