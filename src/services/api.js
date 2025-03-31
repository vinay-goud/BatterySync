import { API_URL } from "../utils/constants";

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
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

      if (response.status === 401) {
        this.handleAuthError();
        throw new Error("Unauthorized");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "API request failed");
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  handleAuthError() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  }

  // Auth endpoints
  async login(email, password) {
    return this.request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email, password) {
    return this.request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
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
