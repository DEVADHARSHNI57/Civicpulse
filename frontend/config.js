window.APP_CONFIG = Object.assign(
  {
    API_BASE_URL: "https://civicpulse-backend-plwc.onrender.com",
    SUPABASE_URL: "",
    SUPABASE_ANON_KEY: ""
  },
  window.APP_CONFIG || {}
);

// Backward compatibility for modules that still read window.API_BASE_URL directly.
window.API_BASE_URL = window.APP_CONFIG.API_BASE_URL;
