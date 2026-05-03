import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { me, adminCars, adminCreateCar, adminRestoreCar, adminSetCarMaintenance, adminDeleteCar } from "../api/auth";
import AdminSidebar from "../components/AdminSidebar";

const PARKING_OPTIONS = [
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

export default function AdminCarsPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);

  // форма добавления
  const [name, setName] = useState("");
  const [carClass, setCarClass] = useState("economy");
  const [img, setImg] = useState("");
  const [description, setDescription] = useState("");
  const [parkingId, setParkingId] = useState(PARKING_OPTIONS[0].id);

  // ремонт
  const [busyId, setBusyId] = useState(null);
  const [maintenanceUntilById, setMaintenanceUntilById] = useState({});
  const [reasonById, setReasonById] = useState({});

  const load = async () => {
    setErr(""); setOk("");
    setLoading(true);
    try {
      const u = await me();
      if (!u) return nav("/login");
      if (!u.is_admin) return nav("/");

      const res = await adminCars({ q, page });
      setData(res);
    } catch (e) {
      const s = e?.response?.status;
      if (s === 401) nav("/login");
      else if (s === 403) nav("/");
      else setErr(e?.response?.data?.message || "Ошибка загрузки авто");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q]);

  const onCreate = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");

    const imgValue = img.trim();
    if (!imgValue) {
      setErr("Добавьте фото автомобиля.");
      return;
    }

    const selectedParking = PARKING_OPTIONS.find((spot) => spot.id === parkingId) ?? PARKING_OPTIONS[0];

    try {
      const car = await adminCreateCar({
        name,
        class: carClass,
        img: imgValue,
        description: description || null,
        lat: selectedParking.lat,
        lng: selectedParking.lng,
        parking_name: selectedParking.name,
        parking_address: selectedParking.address,
      });

      setOk(`Добавлено авто: ${car.name}`);
      setName(""); setImg(""); setDescription(""); setParkingId(PARKING_OPTIONS[0].id);
      setPage(1);
      await load();
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        (e2?.response?.data?.errors
          ? Object.values(e2.response.data.errors).flat().join("\n")
          : null) ||
        "Ошибка добавления авто";
      setErr(msg);
    }
  };

  const toMaintenance = async (carId) => {
    setErr(""); setOk("");
    const until = maintenanceUntilById[carId];
    const reason = reasonById[carId] || "repair";
    if (!until) {
      setErr("Укажи дату/время возврата.");
      return;
    }

    setBusyId(carId);
    try {
      const updated = await adminSetCarMaintenance(carId, until, reason);
      setOk(`Авто #${carId} убрано до ${new Date(updated.maintenance_until).toLocaleString()}`);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Не удалось убрать авто");
    } finally {
      setBusyId(null);
    }
  };

  const restore = async (carId) => {
    setErr(""); setOk("");
    setBusyId(carId);
    try {
      await adminRestoreCar(carId);
      setOk(`Авто #${carId} возвращено в каталог`);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Не удалось вернуть авто");
    } finally {
      setBusyId(null);
    }
  };

  const removeCar = async (carId, carName) => {
    setErr(""); setOk("");
    if (!window.confirm(`Полностью удалить авто "${carName}" (#${carId})? Это действие нельзя отменить.`)) {
      return;
    }

    setBusyId(carId);
    try {
      await adminDeleteCar(carId);
      setOk(`Авто #${carId} удалено`);

      const isLastItemOnPage = (data?.data?.length || 0) === 1 && page > 1;
      if (isLastItemOnPage) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await load();
      }
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Не удалось удалить авто");
    } finally {
      setBusyId(null);
    }
  };

  const getClassColor = (carClass) => {
    switch (carClass) {
      case 'economy': return '#10b981';
      case 'comfort': return '#3b82f6';
      case 'business': return '#8b5cf6';
      case 'premium': return '#f59e0b';
      default: return '#6b7280';
    }
  };


  const selectedParking = PARKING_OPTIONS.find((spot) => spot.id === parkingId) ?? PARKING_OPTIONS[0];

  return (
    <div className="admin-cars-container">
      <style>{`
        .admin-cars-container {
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

        .admin-header {
          background: white;
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .header-top {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (min-width: 768px) {
          .header-top {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .admin-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .nav-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .nav-button {
          padding: 10px 20px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
          text-align: center;
          font-size: 14px;
        }

        .nav-button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .nav-button.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .nav-button.primary:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .message {
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-message {
          background: #fee2e2;
          border: 2px solid #fecaca;
          color: #dc2626;
        }

        .success-message {
          background: #d1fae5;
          border: 2px solid #a7f3d0;
          color: #065f46;
        }

        .add-car-form {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .form-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 24px;
        }

        .form-grid {
          display: grid;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .form-hint {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.4;
        }

        .form-input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          color: #111827;
          transition: all 0.2s;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .form-select {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          color: #111827;
          background: white;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }

        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .submit-button {
          grid-column: 1 / -1;
          padding: 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .submit-button:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
        }

        .controls-panel {
          background: #f1f5f9;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .search-input {
          padding: 12px 20px;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          font-size: 15px;
          color: #1e293b;
          transition: all 0.2s;
          background: white;
          flex: 1;
          min-width: 260px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .refresh-button {
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
        }

        .refresh-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          gap: 16px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .table-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
        }

        .cars-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .table-header {
          background: #f1f5f9;
        }

        .table-header th {
          padding: 18px 20px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }

        .table-body tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }

        .table-body tr:hover {
          background: #f8fafc;
        }

        .table-body td {
          padding: 16px 20px;
          color: #1e293b;
          font-size: 14px;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }

        .car-name {
          font-weight: 500;
          color: #1e293b;
        }

        .class-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f1f5f9;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-maintenance {
          background: #fee2e2;
          color: #dc2626;
        }

        .maintenance-form {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .maintenance-select {
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          color: #1e293b;
          background: white;
          min-width: 120px;
          cursor: pointer;
        }

        .maintenance-input {
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          color: #1e293b;
          background: white;
          min-width: 200px;
        }

        .action-button {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 100px;
        }

        .action-button.maintenance {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-button.maintenance:hover:not(:disabled) {
          background: #fecaca;
          transform: translateY(-1px);
        }

        .action-button.restore {
          background: #d1fae5;
          color: #065f46;
        }

        .action-button.restore:hover:not(:disabled) {
          background: #a7f3d0;
          transform: translateY(-1px);
        }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .row-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .action-button.delete {
          background: #dc2626;
          color: #ffffff;
        }

        .action-button.delete:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          border-top-color: currentColor;
          animation: spin 0.8s linear infinite;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 24px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .page-button {
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .page-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .page-button:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
        }

        .page-info {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
          min-width: 120px;
          text-align: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dark-mode .admin-cars-container {
          background: #111827;
        }

        .dark-mode .admin-header,
        .dark-mode .add-car-form,
        .dark-mode .stat-card,
        .dark-mode .table-container,
        .dark-mode .pagination,
        .dark-mode .controls-panel {
          background: #1f2937;
          border-color: #374151;
        }

        .dark-mode .admin-title,
        .dark-mode .form-title,
        .dark-mode .stat-value,
        .dark-mode .table-body td,
        .dark-mode .car-name {
          color: #f9fafb;
        }

        .dark-mode .nav-button {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .dark-mode .nav-button:hover {
          background: #4b5563;
        }

        .dark-mode .search-input,
        .dark-mode .form-input,
        .dark-mode .form-select,
        .dark-mode .maintenance-select,
        .dark-mode .maintenance-input {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .dark-mode .search-input:focus,
        .dark-mode .form-input:focus,
        .dark-mode .form-select:focus {
          border-color: #3b82f6;
        }

        .dark-mode .table-header {
          background: #374151;
        }

        .dark-mode .table-body tr:hover {
          background: #374151;
        }



        .dark-mode .admin-header p,
        .dark-mode .stat-label,
        .dark-mode .table-header th,
        .dark-mode .page-info,
        .dark-mode .form-hint {
          color: #9ca3af !important;
        }

        @media (max-width: 768px) {
          .admin-cars-container {
            padding: 16px;
          }

          .admin-header {
            padding: 20px;
          }

          .add-car-form {
            padding: 24px;
          }

          .controls-panel {
            padding: 20px;
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            min-width: unset;
          }

          .maintenance-form {
            flex-direction: column;
            align-items: stretch;
          }

          .maintenance-input,
          .maintenance-select {
            min-width: unset;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
        <header className="admin-header">
          <div className="header-top">
            <h1 className="admin-title">Управление автопарком</h1>
            <AdminThemeButtons />
          </div>
          <p style={{color: '#64748b', fontSize: '15px', margin: 0}}>
            Добавление новых автомобилей и управление их обслуживанием
          </p>
        </header>

        {data && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{data.total || 0}</div>
              <div className="stat-label">Всего автомобилей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {data.data.filter(c => c.is_active).length}
              </div>
              <div className="stat-label">Доступно для брони</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {data.data.filter(c => !c.is_active).length}
              </div>
              <div className="stat-label">На обслуживании</div>
            </div>
          </div>
        )}

        {err && (
          <div className="message error-message">
            <span>{err}</span>
          </div>
        )}

        {ok && (
          <div className="message success-message">
            <span>{ok}</span>
          </div>
        )}

        <div className="add-car-form">
          <h3 className="form-title">Добавить новый автомобиль</h3>
          
          <form onSubmit={onCreate} className="form-grid">
            <div className="form-group">
              <label className="form-label">Название автомобиля</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Например: Toyota Camry 2023"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Класс автомобиля</label>
              <select 
                value={carClass} 
                onChange={(e) => setCarClass(e.target.value)}
                className="form-select"
              >
                <option value="economy">Эконом</option>
                <option value="comfort">Комфорт</option>
                <option value="business">Бизнес</option>
                <option value="premium">Премиум</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">URL изображения</label>
              <input
                type="text"
                value={img}
                onChange={(e) => setImg(e.target.value)}
                className="form-input"
                placeholder="https://... или ../img/car.png"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                placeholder="Краткое описание автомобиля"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Парковка размещения</label>
              <select
                value={parkingId}
                onChange={(e) => setParkingId(e.target.value)}
                className="form-select"
                required
              >
                {PARKING_OPTIONS.map((spot) => (
                  <option key={spot.id} value={spot.id}>
                    {spot.name}
                  </option>
                ))}
              </select>
              <div className="form-hint">
                {selectedParking.address}. Координаты: {selectedParking.lat}, {selectedParking.lng}
              </div>
            </div>

            <button type="submit" className="submit-button">
              Добавить автомобиль в автопарк
            </button>
          </form>
        </div>

        <div className="controls-panel">
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Поиск по названию автомобиля..."
            className="search-input"
          />
          
          <button onClick={load} className="refresh-button">
            Обновить список
          </button>
        </div>

        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
            <p style={{color: '#64748b'}}>Загружаем список автомобилей...</p>
          </div>
        ) : !data ? null : (
          <>
            <div className="table-container">
              <table className="cars-table">
                <thead className="table-header">
                  <tr>
                    <th>ID</th>
                    <th>Автомобиль</th>
                    <th>Класс</th>
                    <th>Статус</th>
                    <th>Обслуживание до</th>
                    <th>Причина</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data.data.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: '#64748b'
                        }}>
                          #{c.id}
                        </span>
                      </td>
                      <td>
                        <div className="car-name">{c.name}</div>
                      </td>
                      <td>
                        <span 
                          className="class-badge"
                          style={{
                            backgroundColor: `${getClassColor(c.class)}15`,
                            color: getClassColor(c.class)
                          }}
                        >
                          {c.class}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${c.is_active ? 'status-active' : 'status-maintenance'}`}>
                          {c.is_active ? 'В каталоге' : 'На обслуживании'}
                        </span>
                      </td>
                      <td>
                        {c.maintenance_until ? (
                          <span style={{fontSize: '13px', color: '#64748b'}}>
                            {new Date(c.maintenance_until).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span style={{color: '#9ca3af'}}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{fontSize: '13px', color: '#64748b'}}>
                          {c.maintenance_reason || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {c.is_active ? (
                            <div className="maintenance-form">
                              <select
                                value={reasonById[c.id] || "repair"}
                                onChange={(e) => setReasonById((p) => ({ ...p, [c.id]: e.target.value }))}
                                className="maintenance-select"
                              >
                                <option value="repair">Ремонт</option>
                                <option value="diagnostics">Диагностика</option>
                              </select>

                              <input
                                type="datetime-local"
                                value={maintenanceUntilById[c.id] || ""}
                                onChange={(e) => setMaintenanceUntilById((p) => ({ ...p, [c.id]: e.target.value }))}
                                className="maintenance-input"
                              />

                              <button
                                onClick={() => toMaintenance(c.id)}
                                disabled={busyId === c.id}
                                className="action-button maintenance"
                              >
                                {busyId === c.id ? (
                                  <>
                                    <div className="button-spinner"></div>
                                    <span>...</span>
                                  </>
                                ) : (
                                  'Убрать на обслуживание'
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => restore(c.id)}
                              disabled={busyId === c.id}
                              className="action-button restore"
                            >
                              {busyId === c.id ? (
                                <>
                                  <div className="button-spinner"></div>
                                  <span>...</span>
                                </>
                              ) : (
                                'Вернуть в каталог'
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => removeCar(c.id, c.name)}
                            disabled={busyId === c.id}
                            className="action-button delete"
                          >
                            {busyId === c.id ? (
                              <>
                                <div className="button-spinner"></div>
                                <span>...</span>
                              </>
                            ) : (
                              'Удалить авто'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button 
                className="page-button"
                disabled={!data.prev_page_url}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              
              <div className="page-info">
                Страница {data.current_page} из {data.last_page}
              </div>
              
              <button 
                className="page-button"
                disabled={!data.next_page_url}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперед
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}


