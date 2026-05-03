import { http } from "./http";

export async function createBooking(payload) {
  const { data } = await http.post("/api/bookings", payload);
  return data.booking;
}

export async function getMyBookings() {
  const { data } = await http.get("/api/bookings");
  return data.data ?? [];
}

export async function cancelBooking(id) {
  const { data } = await http.patch(`/api/bookings/${id}/cancel`);
  return data.booking;
}

export async function completeBooking(id, payload) {
  const { data } = await http.patch(`/api/bookings/${id}/complete`, payload);
  return data.booking;
}
