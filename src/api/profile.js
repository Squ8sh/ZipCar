import { http } from "./http";

export async function getProfile() {
  const { data } = await http.get("/api/profile");
  return data.user;
}

export async function updateProfile(payload) {
  const { data } = await http.put("/api/profile", payload);
  return data.user;
}