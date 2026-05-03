export const PARKING_SPOTS = [
  {
    id: "sun-city",
    name: "Парковка ТЦ SUN CITY",
    address: "Набережные Челны, пр. Сююмбике, 2/19",
    lat: 55.7437,
    lng: 52.3955,
  },
  {
    id: "victory-park",
    name: "Парковка у Парка Победы",
    address: "Набережные Челны, пр. Мира, 88",
    lat: 55.7516,
    lng: 52.4079,
  },
  {
    id: "railway",
    name: "Парковка у ЖД вокзала",
    address: "Набережные Челны, Привокзальная улица, 1",
    lat: 55.6999,
    lng: 52.3198,
  },
];

export function parkingKey(name, address) {
  return `${String(name || "").trim()}|${String(address || "").trim()}`;
}
