import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminBookings, me } from "../api/auth";
import AdminSidebar from "../components/AdminSidebar";

const PERIOD_FILTERS = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "month", label: "Текущий месяц" },
  { value: "all", label: "За все время" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Все" },
  { value: "realized", label: "Реализованные" },
  { value: "planned", label: "Планируемые" },
  { value: "canceled", label: "Отмененные" },
];

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function bookingDate(booking) {
  return booking?.start_at || booking?.created_at || null;
}

function bookingPenalty(booking) {
  const explicitPenalty = booking?.overtime_penalty_rub ?? booking?.current_penalty_rub;
  return Math.max(0, toNumber(explicitPenalty));
}

function bookingGrossAmount(booking) {
  const base = toNumber(booking?.price_rub);

  if (booking?.status === "completed") {
    if (booking?.final_price_rub != null) return toNumber(booking.final_price_rub);
    if (booking?.current_total_rub != null) return toNumber(booking.current_total_rub);
    return base + bookingPenalty(booking);
  }

  if (booking?.status === "active") {
    if (booking?.current_total_rub != null) return toNumber(booking.current_total_rub);
    return base + bookingPenalty(booking);
  }

  return base;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function inPeriod(rawDate, period) {
  if (!rawDate) return false;
  if (period === "all") return true;

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const today = startOfToday();

  if (period === "today") {
    return date >= today;
  }

  if (period === "7d") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return date >= start;
  }

  if (period === "30d") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return date >= start;
  }

  if (period === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  return true;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

function getInitialAdminTheme() {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem("site-theme");
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

  return document.body.classList.contains("dark-mode") ? "dark" : "light";
}

function AdminThemeButtons() {
  const [theme, setTheme] = useState(getInitialAdminTheme);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", theme === "dark");
    document.body.classList.toggle("light-mode", theme === "light");
    window.localStorage.setItem("site-theme", theme);
  }, [theme]);

  return (
    <div className="admin-theme-switch" aria-label="Переключение темы">
      <span className="admin-theme-label">Тема</span>
      <div className="admin-theme-buttons">
        <button
          type="button"
          className={`admin-theme-button light${theme === "light" ? " active" : ""}`}
          onClick={() => setTheme("light")}
        >
          Светлая
        </button>
        <button
          type="button"
          className={`admin-theme-button dark${theme === "dark" ? " active" : ""}`}
          onClick={() => setTheme("dark")}
        >
          Темная
        </button>
      </div>
    </div>
  );
}

export default function AdminFinancePage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [bookings, setBookings] = useState([]);
  const [period, setPeriod] = useState("month");
  const [statusView, setStatusView] = useState("all");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);

      try {
        const user = await me();
        if (!user) return nav("/login");
        if (!user.is_admin) return nav("/");

        const first = await adminBookings({ page: 1, sort: "start_at", dir: "desc" });
        const pages = Number(first?.last_page || 1);
        const all = [...(first?.data || [])];

        for (let page = 2; page <= pages; page += 1) {
          const next = await adminBookings({ page, sort: "start_at", dir: "desc" });
          if (Array.isArray(next?.data)) {
            all.push(...next.data);
          }
        }

        setBookings(all);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) nav("/login");
        else if (status === 403) nav("/");
        else setErr(e?.response?.data?.message || "Ошибка загрузки финансовых данных");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [nav, refreshTick]);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const dateOk = inPeriod(bookingDate(booking), period);
      if (!dateOk) return false;

      if (statusView === "all") return true;
      if (statusView === "realized") return booking.status === "completed";
      if (statusView === "planned") return booking.status === "booked" || booking.status === "active";
      if (statusView === "canceled") return booking.status === "canceled";

      return true;
    });
  }, [bookings, period, statusView]);

  const stats = useMemo(() => {
    let realized = 0;
    let planned = 0;
    let canceled = 0;
    let realizedPenalties = 0;
    let plannedPenalties = 0;
    let activeCount = 0;
    let completedCount = 0;
    let bookedCount = 0;
    let canceledCount = 0;

    for (const booking of filtered) {
      if (booking.status === "completed") {
        realized += bookingGrossAmount(booking);
        realizedPenalties += bookingPenalty(booking);
        completedCount += 1;
      } else if (booking.status === "active") {
        planned += bookingGrossAmount(booking);
        plannedPenalties += bookingPenalty(booking);
        activeCount += 1;
      } else if (booking.status === "booked") {
        planned += toNumber(booking.price_rub);
        bookedCount += 1;
      } else if (booking.status === "canceled") {
        canceled += toNumber(booking.price_rub);
        canceledCount += 1;
      }
    }

    const totalPenalties = realizedPenalties + plannedPenalties;
    const totalPotential = realized + planned;
    const averageCheck = completedCount > 0 ? realized / completedCount : 0;

    return {
      realized,
      planned,
      canceled,
      realizedPenalties,
      plannedPenalties,
      totalPenalties,
      totalPotential,
      averageCheck,
      totalBookings: filtered.length,
      activeCount,
      completedCount,
      bookedCount,
      canceledCount,
    };
  }, [filtered]);

  const topCars = useMemo(() => {
    const map = new Map();

    for (const booking of filtered) {
      if (booking.status !== "completed") continue;

      const key = String(booking?.car?.id || booking?.car_id || "unknown");
      const prev = map.get(key) || {
        name: booking?.car?.name || `Авто #${booking?.car_id || "?"}`,
        revenue: 0,
        trips: 0,
      };
      prev.revenue += bookingGrossAmount(booking);
      prev.trips += 1;
      map.set(key, prev);
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filtered]);

  const dailyReport = useMemo(() => {
    const days = new Map();

    for (const booking of filtered) {
      const raw = bookingDate(booking);
      if (!raw) continue;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) continue;

      const key = date.toISOString().slice(0, 10);
      const prev = days.get(key) || { trips: 0, realized: 0, planned: 0, canceled: 0 };
      prev.trips += 1;

      if (booking.status === "completed") prev.realized += bookingGrossAmount(booking);
      else if (booking.status === "active") prev.planned += bookingGrossAmount(booking);
      else if (booking.status === "booked") prev.planned += toNumber(booking.price_rub);
      else if (booking.status === "canceled") prev.canceled += toNumber(booking.price_rub);

      days.set(key, prev);
    }

    return Array.from(days.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 10)
      .map(([key, value]) => {
        const [year, month, day] = key.split("-");
        return {
          dateLabel: `${day}.${month}.${year}`,
          ...value,
        };
      });
  }, [filtered]);

  const recentBookings = useMemo(() => {
    return [...filtered]
      .sort((a, b) => {
        const aTime = new Date(bookingDate(a) || 0).getTime();
        const bTime = new Date(bookingDate(b) || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 20);
  }, [filtered]);

  return (
    <div className="admin-finance-container">
      <style>{`
        .admin-finance-container {
          min-height: 100vh;
          background: #f8fafc;
          padding: 24px;
        }


        .admin-theme-switch {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .admin-theme-label {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-theme-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-theme-button {
          min-width: 104px;
          border: none;
          border-radius: 10px;
          padding: 9px 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .admin-theme-button.light {
          background: #ffffff;
          color: #111827;
          box-shadow: inset 0 0 0 1px #dbe3ef;
        }

        .admin-theme-button.dark {
          background: #111827;
          color: #ffffff;
          box-shadow: inset 0 0 0 1px #111827;
        }

        .admin-theme-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
        }

        .admin-theme-button.active {
          outline: 3px solid rgba(59, 130, 246, 0.22);
        }

        .dark-mode .admin-theme-switch {
          background: #111827;
          border-color: #374151;
        }

        .dark-mode .admin-theme-label {
          color: #9ca3af;
        }

        .dark-mode .admin-theme-button.light {
          background: #f9fafb;
          color: #111827;
          box-shadow: inset 0 0 0 1px #d1d5db;
        }

        .dark-mode .admin-theme-button.dark {
          background: #2563eb;
          color: #ffffff;
          box-shadow: inset 0 0 0 1px #60a5fa;
        }

        @media (max-width: 640px) {
          .admin-theme-switch {
            width: 100%;
            justify-content: space-between;
          }

          .admin-theme-buttons {
            width: 100%;
          }

          .admin-theme-button {
            width: 100%;
          }
        }

        .admin-content {
          min-width: 0;
        }

        .admin-header,
        .panel {
          background: white;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .admin-header {
          padding: 28px 32px;
          margin-bottom: 20px;
        }

        .finance-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .admin-title {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
        }

        .admin-subtitle {
          margin: 0;
          color: #64748b;
          font-size: 15px;
        }

        .controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .controls select,
        .controls button {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 2px solid #cbd5e1;
          background: white;
          padding: 0 12px;
          font-size: 14px;
          color: #1e293b;
        }

        .controls button {
          cursor: pointer;
          border-color: #3b82f6;
          color: #1d4ed8;
          font-weight: 600;
        }

        .finance-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .finance-card {
          padding: 18px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .finance-card-label {
          color: #64748b;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .finance-card-value {
          color: #0f172a;
          font-size: 24px;
          font-weight: 700;
        }

        .finance-card-sub {
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .panel {
          padding: 20px;
        }

        .panel h3 {
          margin: 0 0 14px;
          font-size: 18px;
          color: #0f172a;
        }

        .list {
          display: grid;
          gap: 10px;
        }

        .list-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 10px;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
        }

        .list-item span {
          font-size: 14px;
          color: #334155;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        th,
        td {
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 8px;
          text-align: left;
          font-size: 14px;
          color: #334155;
        }

        th {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .status {
          display: inline-block;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          background: #f1f5f9;
        }

        .status.completed { background: #dcfce7; color: #166534; }
        .status.active { background: #dbeafe; color: #1e40af; }
        .status.booked { background: #fef3c7; color: #92400e; }
        .status.canceled { background: #fee2e2; color: #991b1b; }

        .error {
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fee2e2;
          color: #991b1b;
          margin-bottom: 16px;
        }

        .loader {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 30px;
          color: #64748b;
        }

        .dark-mode .admin-finance-container {
          background: #111827;
        }

        .dark-mode .admin-header,
        .dark-mode .panel,
        .dark-mode .finance-card {
          background: #1f2937;
          border-color: #374151;
        }

        .dark-mode .admin-title,
        .dark-mode .finance-card-value,
        .dark-mode .panel h3,
        .dark-mode td,
        .dark-mode .list-item span {
          color: #f9fafb;
        }

        .dark-mode .admin-subtitle,
        .dark-mode .finance-card-label,
        .dark-mode .finance-card-sub,
        .dark-mode th {
          color: #9ca3af;
        }

        .dark-mode .list-item,
        .dark-mode th,
        .dark-mode td {
          border-color: #374151;
        }

        .dark-mode .controls select,
        .dark-mode .controls button {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .dark-mode .loader {
          background: #1f2937;
          border-color: #374151;
          color: #9ca3af;
        }

        @media (max-width: 640px) {
          .finance-header-top {
            flex-direction: column;
            align-items: stretch;
          }
        }

        @media (max-width: 1200px) {
          .controls {
            grid-template-columns: 1fr 1fr;
          }

          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-content">
          <header className="admin-header">
            <div className="finance-header-top">
              <div>
                <h1 className="admin-title">Финансы</h1>
                <p className="admin-subtitle">Сводка выручки и бронирований по выбранному периоду</p>
              </div>
              <AdminThemeButtons />
            </div>
          </header>

          {err ? <div className="error">{err}</div> : null}

          <div className="controls">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIOD_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select value={statusView} onChange={(e) => setStatusView(e.target.value)}>
              {STATUS_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button onClick={() => setRefreshTick((x) => x + 1)} type="button">
              Обновить данные
            </button>
          </div>

          {loading ? (
            <div className="loader">Загрузка финансовых данных...</div>
          ) : (
            <>
              <section className="finance-cards">
                <div className="finance-card">
                  <div className="finance-card-label">Реализованная выручка</div>
                  <div className="finance-card-value">{rub.format(stats.realized)}</div>
                  <div className="finance-card-sub">
                    {stats.completedCount} завершенных бронирований, штрафы: {rub.format(stats.realizedPenalties)}
                  </div>
                </div>

                <div className="finance-card">
                  <div className="finance-card-label">Планируемая выручка</div>
                  <div className="finance-card-value">{rub.format(stats.planned)}</div>
                  <div className="finance-card-sub">
                    {stats.bookedCount + stats.activeCount} активных и забронированных, штрафы: {rub.format(stats.plannedPenalties)}
                  </div>
                </div>

                <div className="finance-card">
                  <div className="finance-card-label">Потенциал</div>
                  <div className="finance-card-value">{rub.format(stats.totalPotential)}</div>
                  <div className="finance-card-sub">Реализовано + планируется</div>
                </div>

                <div className="finance-card">
                  <div className="finance-card-label">Штрафы (всего)</div>
                  <div className="finance-card-value">{rub.format(stats.totalPenalties)}</div>
                  <div className="finance-card-sub">Завершенные + активные бронирования</div>
                </div>

                <div className="finance-card">
                  <div className="finance-card-label">Отмененные суммы</div>
                  <div className="finance-card-value">{rub.format(stats.canceled)}</div>
                  <div className="finance-card-sub">{stats.canceledCount} отмененных бронирований</div>
                </div>

                <div className="finance-card">
                  <div className="finance-card-label">Средний чек</div>
                  <div className="finance-card-value">{rub.format(stats.averageCheck)}</div>
                  <div className="finance-card-sub">По завершенным бронированиям</div>
                </div>

                <div className="finance-card">
                  <div className="finance-card-label">Всего бронирований</div>
                  <div className="finance-card-value">{stats.totalBookings}</div>
                  <div className="finance-card-sub">С учетом фильтров</div>
                </div>
              </section>

              <section className="grid-2">
                <div className="panel">
                  <h3>Топ автомобилей по выручке</h3>

                  {topCars.length === 0 ? (
                    <div className="finance-card-sub">Нет завершенных поездок для выбранного фильтра.</div>
                  ) : (
                    <div className="list">
                      {topCars.map((car, index) => (
                        <div className="list-item" key={`${car.name}-${index}`}>
                          <span>{car.name}</span>
                          <span>{car.trips} поездок</span>
                          <span>{rub.format(car.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <h3>Динамика по дням</h3>

                  {dailyReport.length === 0 ? (
                    <div className="finance-card-sub">Нет данных за выбранный период.</div>
                  ) : (
                    <div className="list">
                      {dailyReport.map((day) => (
                        <div className="list-item" key={day.dateLabel}>
                          <span>{day.dateLabel}</span>
                          <span>{day.trips} броней</span>
                          <span>{rub.format(day.realized)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="panel">
                <h3>Последние операции</h3>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Дата</th>
                        <th>Пользователь</th>
                        <th>Автомобиль</th>
                        <th>Статус</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6}>Нет записей для выбранного фильтра</td>
                        </tr>
                      ) : (
                        recentBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td>#{booking.id}</td>
                            <td>{formatDate(bookingDate(booking))}</td>
                            <td>{booking?.user?.name || "Не указан"}</td>
                            <td>{booking?.car?.name || `Авто #${booking?.car_id || "?"}`}</td>
                            <td>
                              <span className={`status ${booking.status || ""}`}>{booking.status || "unknown"}</span>
                            </td>
                            <td>{rub.format(bookingGrossAmount(booking))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
