import { API_URL } from "../utils/constants";

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || API_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: window.location.origin,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        mode: "cors",
      });

      const data = await response.json();

      if (response.status === 401) {
        this.handleAuthError();
        throw new Error("Unauthorized access. Please login again.");
      }

      if (!response.ok) {
        throw new Error(data.detail || "Request failed");
      }

      return data;
    } catch (error) {
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  }

  handleAuthError() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request("/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        device_id: localStorage.getItem("deviceId") || crypto.randomUUID(),
      }),
    });
  }

  async signup(email, password) {
    return this.request("/signup", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        device_id: localStorage.getItem("deviceId") || crypto.randomUUID(),
      }),
    });
  }

  // Battery endpoints
  async getBatteryStatus(email) {
    return this.request(`/batterystatus?email=${encodeURIComponent(email)}`);
  }

  async updateBatteryStatus(batteryData) {
    return this.request("/update_battery", {
      method: "POST",
      body: JSON.stringify(batteryData),
    });
  }
}

export const api = new ApiService();
