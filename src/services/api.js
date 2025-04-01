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
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const url = `${this.baseURL}${endpoint}`;
    console.log("Requesting:", url); // For debugging

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: "cors",
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error("Unauthorized access");
        }
        const error = await response.json();
        throw new Error(error.detail || "Request failed");
      }

      return response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw new Error(
        error.message || "Network error. Please check your connection."
      );
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request("/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });
  }

  async signup(email, password) {
    return this.request("/signup", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
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
