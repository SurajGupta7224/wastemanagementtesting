// src/services/api.js
export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/admin";


function getUserId() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const user = JSON.parse(raw);
    return user && user.id ? user.id : "";
  } catch {
    return "";
  }
}

function isFormData(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function apiFetch(path, options = {}) {
  const { method = "GET", body, headers = {}, ...rest } = options;

  const url = `${BASE_URL}${path}`;
  const userId = getUserId();

  const baseHeaders = {
    "x-user-id": userId,
    ...headers,
  };

  const finalHeaders = isFormData(body)
    ? baseHeaders
    : {
        "Content-Type": "application/json",
        ...baseHeaders,
      };

  const fetchOptions = {
    method,
    credentials: rest.credentials ?? "include",
    ...rest,
    headers: finalHeaders,
  };

  if (body !== undefined && body !== null) {
    fetchOptions.body = isFormData(body) ? body : JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
}

export const api = {
  get: (path, options = {}) =>
    apiFetch(path, { ...options, method: "GET" }),

  post: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: "POST", body }),

  put: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: "PUT", body }),

  patch: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: "PATCH", body }),

  del: (path, options = {}) =>
    apiFetch(path, { ...options, method: "DELETE" }),

  delete: (path, options = {}) =>
    apiFetch(path, { ...options, method: "DELETE" }),
};
