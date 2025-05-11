// API client utility
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  // Default options for fetch
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  // Handle non-JSON responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  }

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.text();
}

// Helper methods for common HTTP methods
export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    fetchApi(endpoint, { method: "GET", ...options }),

  post: (endpoint: string, data: any, options?: RequestInit) =>
    fetchApi(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    }),

  put: (endpoint: string, data: any, options?: RequestInit) =>
    fetchApi(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    fetchApi(endpoint, { method: "DELETE", ...options }),
};
