import api from "./api";

export type UserRole = "manager" | "admin" | "coach" | "user";

export interface LoginResponse {
  message: string;
  token: string;
  role: UserRole;
}

export interface ApiMessageResponse {
  message: string;
}

export interface VerifyOtpResponse {
  message: string;
  reset_token: string;
}

export async function login(email: string, password: string) {
  const response = await api.post<LoginResponse>("/login", {
    email,
    password,
  });

  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post<ApiMessageResponse>("/forgot-password", {
    email,
  });

  return response.data;
}

export async function verifyOtp(email: string, OTP: string) {
  const response = await api.post<VerifyOtpResponse>("/verify-otp", {
    email,
    OTP,
  });

  return response.data;
}

export async function resetPassword(
  reset_token: string,
  password: string,
  password_confirmation: string
) {
  const response = await api.post<ApiMessageResponse>("/reset-password", {
    reset_token,
    password,
    password_confirmation,
  });

  return response.data;
}

export function saveAuth(token: string, role: UserRole) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  sessionStorage.removeItem("reset_token");
  sessionStorage.removeItem("reset_email");
}

export function getRole() {
  return localStorage.getItem("role") as UserRole | null;
}

export function getToken() {
  return localStorage.getItem("token");
}