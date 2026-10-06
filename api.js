(function configureChaudhariApi() {
  const configuredBaseUrl =
    window.CHAUDHARI_API_BASE_URL || "https://chaudhari-manufacturing-backend.onrender.com/api";
  const baseUrl = configuredBaseUrl.replace(/\/+$/, "");

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}/${String(path).replace(/^\/+/, "")}`, options);
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
  }

  window.ChaudhariAPI = Object.freeze({
    baseUrl,
    get(path) {
      return request(path);
    },
    post(path, body) {
      return request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
  });
})();
