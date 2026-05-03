import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCar, getCars } from "../api/cars";
import { createBooking } from "../api/bookings";
import { PARKING_SPOTS, parkingKey } from "../constants/parkingSpots";
import "./booking.css";

function getModeMeta(mode) {
  if (mode === "hour") return { label: "Почасово", min: 1, max: 24, unit: "час" };
  if (mode === "day") return { label: "Посуточно", min: 1, max: 30, unit: "сут" };
  return { label: "До завершения", min: 0, max: 0, unit: "" };
}

function calcBase(mode, value) {
  if (mode === "hour") return value * 450;
  if (mode === "day") return value * 9800;
  return 0;
}

function calcMinutes(mode, value) {
  if (mode === "hour") return value * 60;
  if (mode === "day") return value * 24 * 60;
  return null;
}

export default function BookingPage() {
  const { carId, id } = useParams();
  const resolvedCarId = carId ?? id;
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [form, setForm] = useState({
    start_at: "",
    driver_name: "",
    tariff_mode: "hour",
    tariff_value: 1,
    ride_type: "city",
    parking_id: PARKING_SPOTS[0].id,
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [parkingCounts, setParkingCounts] = useState({});

  useEffect(() => {
    let mounted = true;

    async function loadCarAndParkingStats() {
      try {
        setPageLoading(true);
        const [carData, carsData] = await Promise.all([getCar(resolvedCarId), getCars()]);
        if (!mounted) return;

        setCar(carData);

        const counts = {};
        for (const item of Array.isArray(carsData) ? carsData : []) {
          const key = parkingKey(item?.parking_name, item?.parking_address);
          counts[key] = (counts[key] || 0) + 1;
        }
        setParkingCounts(counts);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Не удалось загрузить данные автомобиля");
      } finally {
        if (mounted) setPageLoading(false);
      }
    }

    loadCarAndParkingStats();
    return () => {
      mounted = false;
    };
  }, [resolvedCarId]);

  const modeMeta = useMemo(() => getModeMeta(form.tariff_mode), [form.tariff_mode]);
  const selectedParking = useMemo(
    () => PARKING_SPOTS.find((x) => x.id === form.parking_id) ?? PARKING_SPOTS[0],
    [form.parking_id]
  );

  const planned = useMemo(() => {
    const numericValue = Number(form.tariff_value || 0);
    const base = calcBase(form.tariff_mode, numericValue);
    const total = form.ride_type === "intercity" ? Math.round(base * 1.1) : base;
    const minutes = calcMinutes(form.tariff_mode, numericValue);

    return { base, total, minutes };
  }, [form.tariff_mode, form.tariff_value, form.ride_type]);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "tariff_mode") {
      const nextMode = value;
      const nextMeta = getModeMeta(nextMode);
      setForm((prev) => ({
        ...prev,
        tariff_mode: nextMode,
        tariff_value:
          nextMode === "open"
            ? 1
            : Math.min(Math.max(Number(prev.tariff_value || 1), nextMeta.min), nextMeta.max),
      }));
      return;
    }

    if (name === "tariff_value") {
      const parsed = Number(value || 0);
      const clamped = Math.max(modeMeta.min, Math.min(modeMeta.max, parsed));
      setForm((prev) => ({ ...prev, tariff_value: clamped }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createBooking({
        car_id: Number(resolvedCarId),
        start_at: form.start_at,
        driver_name: form.driver_name,
        tariff_mode: form.tariff_mode,
        tariff_value: form.tariff_mode === "open" ? null : Number(form.tariff_value),
        ride_type: form.ride_type,
        parking_name: selectedParking.name,
        parking_address: selectedParking.address,
      });

      navigate("/my-bookings");
    } catch (e) {
      setError(e?.response?.data?.message || "Не удалось создать бронирование");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) return <div className="booking-page">Загрузка...</div>;

  return (
    <div className="booking-page">
      <div className="booking-top">
        <h1>Бронирование автомобиля</h1>
        <div className="booking-links">
          <Link to="/second">Назад к автопарку</Link>
          <Link to="/my-bookings">Мои поездки</Link>
        </div>
      </div>

      {error && <div className="booking-errors">{error}</div>}

      {car && (
        <div className="booking-grid">
          <section className="booking-left">
            <h2 className="booking-title">{car.name}</h2>
            <p className="booking-meta">
              Класс: <strong>{car.class}</strong>
              {car.plate_number ? (
                <>
                  {" "}· Госномер: <strong>{car.plate_number}</strong>
                </>
              ) : null}
            </p>

            <div className="booking-photo">
              <img src={car.img} alt={car.name} />
            </div>

            <div className="booking-specs">
              <h3>Характеристики</h3>
              <ul>
                <li>Объем бака: {car.fuel_capacity_l ?? "—"} л</li>
                <li>Мощность: {car.power_hp ?? "—"} л.с.</li>
                <li>Мест: {car.seats ?? "—"}</li>
                <li>Коробка: {car.transmission ?? "—"}</li>
              </ul>
            </div>

            <p className="booking-desc">{car.description}</p>
          </section>

          <section className="booking-right">
            <form onSubmit={handleSubmit} className="booking-form">
              <label>
                Время начала аренды
                <input
                  type="datetime-local"
                  name="start_at"
                  value={form.start_at}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                ФИО водителя
                <input
                  type="text"
                  name="driver_name"
                  value={form.driver_name}
                  onChange={handleChange}
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </label>

              <div>
                <p className="booking-label">Тариф аренды</p>
                <div className="booking-mode-grid">
                  <label className={`booking-mode ${form.tariff_mode === "hour" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="tariff_mode"
                      value="hour"
                      checked={form.tariff_mode === "hour"}
                      onChange={handleChange}
                    />
                    <span>Почасово (450 ₽/час, до 24 ч)</span>
                  </label>
                  <label className={`booking-mode ${form.tariff_mode === "day" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="tariff_mode"
                      value="day"
                      checked={form.tariff_mode === "day"}
                      onChange={handleChange}
                    />
                    <span>Посуточно (9800 ₽/сутки)</span>
                  </label>
                  <label className={`booking-mode ${form.tariff_mode === "open" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="tariff_mode"
                      value="open"
                      checked={form.tariff_mode === "open"}
                      onChange={handleChange}
                    />
                    <span>До самостоятельного завершения</span>
                  </label>
                </div>
              </div>

              {form.tariff_mode !== "open" && (
                <label>
                  Длительность ({modeMeta.unit})
                  <input
                    type="number"
                    name="tariff_value"
                    min={modeMeta.min}
                    max={modeMeta.max}
                    value={form.tariff_value}
                    onChange={handleChange}
                    required
                  />
                  <span className="booking-hint">
                    Допустимо: от {modeMeta.min} до {modeMeta.max} {modeMeta.unit}
                  </span>
                </label>
              )}

              <label className="booking-checkbox">
                <input
                  type="checkbox"
                  checked={form.ride_type === "intercity"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      ride_type: e.target.checked ? "intercity" : "city",
                    }))
                  }
                />
                <span>Межгород (+10% к стоимости)</span>
              </label>

              <div>
                <p className="booking-label">Парковка выдачи (Набережные Челны)</p>
                <div className="parking-list">
                  {PARKING_SPOTS.map((spot) => (
                    <label key={spot.id} className={`parking-item ${form.parking_id === spot.id ? "active" : ""}`}>
                      <input
                        type="radio"
                        name="parking_id"
                        value={spot.id}
                        checked={form.parking_id === spot.id}
                        onChange={handleChange}
                      />
                      <div>
                        <strong>{spot.name}</strong>
                        <p>{spot.address}</p>
                        <p className="parking-count">
                          Автомобилей на парковке: {parkingCounts[parkingKey(spot.name, spot.address)] || 0}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="booking-sum">
                {form.tariff_mode === "open" ? (
                  <p>Стоимость будет рассчитана по фактическому времени после завершения поездки.</p>
                ) : (
                  <>
                    <div className="booking-sum-row">
                      <span>Базовая стоимость:</span>
                      <strong>{planned.base} ₽</strong>
                    </div>
                    <div className="booking-sum-row">
                      <span>Итого{form.ride_type === "intercity" ? " (с межгородом)" : ""}:</span>
                      <strong>{planned.total} ₽</strong>
                    </div>
                    {planned.minutes !== null && (
                      <div className="booking-sum-row">
                        <span>Длительность:</span>
                        <strong>{planned.minutes} мин</strong>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button type="submit" disabled={loading} className="booking-btn">
                {loading ? "Создание..." : "Арендовать"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
