import api from "./api";
import type {
  User,
  LoginData,
  RegisterData,
  UpdateProfileData,
} from "../types/auth.types";

export const authService = {
  async login(data: LoginData) {
    const response = await api.post("/auth/login", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await api.post("/auth/register", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async updateProfile(data: UpdateProfileData) {
    const response = await api.patch("/auth/profile", data);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await api.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },
};
