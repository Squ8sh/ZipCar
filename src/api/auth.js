import { http } from "./http";

export async function csrf() {
  await http.get("/sanctum/csrf-cookie");
}

export async function me() {
  const { data } = await http.get("/me");
  return data.user;
}

export async function login(payload) {
  await csrf();
  const { data } = await http.post("/login", payload);
  return data.user;
}

export async function register(payload) {
  await csrf();
  const { data } = await http.post("/register", payload);
  return data.user;
}

export async function logout() {
  await http.post("/logout");
}

// -------- ADMIN --------

export async function adminUsers({ q = "", sort = "id", dir = "desc", page = 1 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("sort", sort);
  params.set("dir", dir);
  params.set("page", String(page));

  const { data } = await http.get(`/api/admin/users?${params.toString()}`);
  return data;
}

export async function setUserAdmin(userId, is_admin) {
  const { data } = await http.patch(`/api/admin/users/${userId}/admin`, { is_admin });
  return data.user;
}

export async function setUserBlocked(userId, is_blocked, reason = null) {
  const { data } = await http.patch(`/api/admin/users/${userId}/block`, { is_blocked, reason });
  return data.user;
}

export async function profile() {
  const { data } = await http.get("/api/profile");
  return data.user;
}

export async function updateProfile(payload) {
  const { data } = await http.put("/api/profile", payload);
  return data.user;
}

export async function changePassword(payload) {
  const { data } = await http.put("/api/profile/password", payload);
  return data.ok;
}

export async function uploadAvatar(file) {
  const form = new FormData();
  form.append("avatar", file);

  const { data } = await http.post("/api/profile/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.user;
}

export async function sendEmailCode() {
  const { data } = await http.post("/api/profile/email/send-code");
  return data;
}

export async function verifyEmailCode(code) {
  const { data } = await http.post("/api/profile/email/verify", { code });
  return data.user;
}

export async function getCar(id) {
  const { data } = await http.get(`/api/cars/${id}`);
  return data.car;
}

export async function createBooking(payload) {
  const { data } = await http.post("/api/bookings", payload);
  return data.booking;
}

export async function myBookings(page = 1) {
  const { data } = await http.get(`/api/bookings?page=${page}`);
  return data;
}

export async function adminBookings({ q = "", status = "", sort = "start_at", dir = "desc", page = 1 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  params.set("sort", sort);
  params.set("dir", dir);
  params.set("page", String(page));

  const { data } = await http.get(`/api/admin/bookings?${params.toString()}`);
  return data;
}

export async function adminSetBookingStatus(bookingId, status) {
  const { data } = await http.patch(`/api/admin/bookings/${bookingId}/status`, { status });
  return data.booking;
}

export async function adminCars({ q = "", page = 1 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  const { data } = await http.get(`/api/admin/cars?${params.toString()}`);
  return data;
}

export async function adminCreateCar(payload) {
  const { data } = await http.post("/api/admin/cars", payload);
  return data.car;
}

export async function adminSetCarMaintenance(carId, maintenance_until, reason) {
  const { data } = await http.patch(`/api/admin/cars/${carId}/maintenance`, { maintenance_until, reason });
  return data.car;
}

export async function adminRestoreCar(carId) {
  const { data } = await http.patch(`/api/admin/cars/${carId}/restore`);
  return data.car;
}

export async function adminDeleteCar(carId) {
  const { data } = await http.delete(`/api/admin/cars/${carId}`);
  return data;
}

export async function cancelMyBooking(bookingId) {
  const { data } = await http.patch(`/api/bookings/${bookingId}/cancel`);
  return data.booking;
}

export async function completeMyBooking(bookingId, payload) {
  const { data } = await http.patch(`/api/bookings/${bookingId}/complete`, payload);
  return data.booking;
}

export async function getNotifications(page = 1) {
  const { data } = await http.get(`/api/notifications?page=${page}`);
  return data;
}

export async function markNotificationRead(id) {
  await http.patch(`/api/notifications/${id}/read`);
}

export async function notificationAction(id, payload) {
  const { data } = await http.post(`/api/notifications/${id}/action`, payload);
  return data;
}

export async function getPublicReviews(limit = 12) {
  const { data } = await http.get(`/api/reviews?limit=${limit}`);
  return data.data ?? data.reviews ?? [];
}

export async function createBookingReview(bookingId, payload) {
  const { data } = await http.post(`/api/bookings/${bookingId}/review`, {
    text: payload?.text ?? "",
    rating: payload?.rating ?? 5,
  });
  return data.review ?? data.data ?? data;
}
