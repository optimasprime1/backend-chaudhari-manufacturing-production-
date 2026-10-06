(function configureChaudhariApi() {
  const configuredBaseUrl =
    window.CHAUDHARI_API_BASE_URL || "https://chaudhari-manufacturing-backend.onrender.com/api";
  const baseUrl = configuredBaseUrl.replace(/\/+$/, "");

  window.ChaudhariAPI = Object.freeze({
    baseUrl,
    async get(path) {
      const response = await fetch(`${baseUrl}/${String(path).replace(/^\/+/, "")}`);
      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        payload = { success: false, message: "The API returned an invalid response." };
      }

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || `Request failed with status ${response.status}.`);
      }

      return payload;
    },
  });
})();
