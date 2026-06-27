// src/services/api.js
import axios from "axios";

// Your backend's verifyJWT middleware reads the auth token from an
// HttpOnly cookie (set by /login on the response), not from an
// Authorization header. withCredentials: true is what makes the browser
// actually attach that cookie on cross-origin requests to your Render
// backend — this is the only piece needed for auth to work correctly
// with your current backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;