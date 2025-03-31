import { create } from "zustand";

const useAuth = create((set) => ({
  token: localStorage.getItem("authToken"),
  email: localStorage.getItem("userEmail"),

  login: (token, email) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userEmail", email);
    set({ token, email });
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    set({ token: null, email: null });
  },
}));

export default useAuth;
