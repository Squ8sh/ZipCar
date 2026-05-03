import { http } from "./http";

export async function getCars() {
  const all = [];
  let page = 1;

  while (true) {
    const { data } = await http.get(`/api/cars?page=${page}`);
    const items = data.data ?? [];
    all.push(...items);
    if (!data.next_page_url) break;
    page += 1;
  }

  return all;
}

export async function getCar(id) {
  const { data } = await http.get(`/api/cars/${id}`);
  return data.car;
}
