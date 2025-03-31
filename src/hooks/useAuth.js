import { create } from "zustand";

const handleSignup = async (e) => {
  e.preventDefault();
  setError('');

  try {
      const response = await fetch(`${API_URL}/signup`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': window.location.origin
          },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify({ 
              email: email.trim(),
              password: password,
              device_id: localStorage.getItem('deviceId') || crypto.randomUUID()
          })
      });

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
