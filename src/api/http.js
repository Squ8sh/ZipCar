import axios from "axios";

const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const http = axios.create({
  baseURL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

http.defaults.xsrfCookieName = "XSRF-TOKEN";
http.defaults.xsrfHeaderName = "X-XSRF-TOKEN";

export async function getCsrfCookie() {
  await http.get("/sanctum/csrf-cookie");
}