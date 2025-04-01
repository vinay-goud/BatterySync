// batterysync-react/src/services/api.js
import { API_URL } from "../utils/constants";

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  async request(endpoint, options = {}) {
    console.log(`Requesting: ${this.baseUrl}/${endpoint}`);

    // Set default headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Create request URL
    const url = `${this.baseUrl}/${endpoint}`;

    // Create request options
    const requestOptions = {
      ...options,
      headers,
      credentials: "include", // Include credentials for CORS
    };

    try {
      const response = await fetch(url, requestOptions);

      // Check for HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: `HTTP error ${response.status}`,
        }));

        // Handle auth errors
        if (response.status === 401) {
          this.handleAuthError();
        }

        throw new Error(errorData.detail || "Unknown API error");
      }

      // Return JSON response or empty object if no content
      return response.status !== 204 ? await response.json() : {};
    } catch (error) {
      console.error(`API request failed: ${error.message}`);

      // Format error message
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "Network error: Could not connect to the server. Please check your internet connection or try again later."
        );
      }

      throw error;
    }
  }

  handleAuthError() {
    // Clear auth data and redirect to login
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  }

  // Auth endpoints
  async login(email, password) {
    return this.request("login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email, password) {
    return this.request("signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Battery endpoints
  async getBatteryStatus(email) {
    return this.request(`battery_status?email=${encodeURIComponent(email)}`);
  }

  async updateBatteryStatus(batteryData) {
    console.log("Sending battery update to API:", batteryData);
    try {
      const result = await this.request("update_battery", {
        method: "POST",
        body: JSON.stringify(batteryData),
      });
      console.log("Battery update API response:", result);
      return result;
    } catch (error) {
      console.error("Battery update API error:", error);
      throw error;
    }
  }
}

export const api = new ApiService();
