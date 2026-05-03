import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminBookings, adminSetBookingStatus, me } from "../api/auth";
import AdminSidebar from "../components/AdminSidebar";

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

export default function AdminBookingsPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("start_at");
  const [dir, setDir] = useState("desc");
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const u = await me();
      if (!u) return nav("/login");
      if (!u.is_admin) return nav("/");

      const res = await adminBookings({ q, status, sort, dir, page });
      setData(res);
    } catch (e) {
      const s = e?.response?.status;
      if (s === 401) nav("/login");
      else if (s === 403) nav("/");
      else setErr(e?.response?.data?.message || "Ошибка загрузки бронирований");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, status, sort, dir]);

  const flipDir = () => {
    setDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const setStatusRow = async (b, nextStatus) => {
    setBusyId(b.id);
    setErr("");
    try {
      const updated = await adminSetBookingStatus(b.id, nextStatus);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((x) => (x.id === updated.id ? updated : x)),
        };
      });
    } catch (e) {
      setErr(e?.response?.data?.message || "Не удалось обновить статус");
    } finally {
      setBusyId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      case 'booked': return '#f59e0b';
      case 'canceled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-bookings-container">
      <style>{`
        .admin-bookings-container {
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
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }

        .admin-title::before {
          content: "📅";
          font-size: 24px;
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

        .controls-panel {
          background: #f1f5f9;
          border-radius: 16px;
          padding: 24px;
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (min-width: 1024px) {
          .controls-panel {
            grid-template-columns: 1fr auto auto auto auto;
            align-items: center;
          }
        }

        .search-input {
          padding: 12px 20px;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          font-size: 15px;
          color: #1e293b;
          transition: all 0.2s;
          background: white;
          width: 100%;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .filter-select {
          padding: 12px 20px;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          font-size: 15px;
          color: #1e293b;
          background: white;
          min-width: 150px;
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .sort-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .sort-select {
          padding: 12px 20px;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          font-size: 15px;
          color: #1e293b;
          background: white;
          min-width: 160px;
          cursor: pointer;
        }

        .dir-button {
          padding: 12px 20px;
          background: white;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          color: #475569;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 100px;
          justify-content: center;
        }

        .dir-button:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
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
          justify-content: center;
        }

        .refresh-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .error-message {
          background: #fee2e2;
          border: 2px solid #fecaca;
          color: #dc2626;
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

        .bookings-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
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
          vertical-align: top;
          border-bottom: 1px solid #f1f5f9;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name {
          font-weight: 500;
          color: #1e293b;
        }

        .user-email {
          font-size: 12px;
          color: #64748b;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f1f5f9;
          color: #475569;
        }

        .price-cell {
          font-weight: 700;
          color: #1e293b;
          font-size: 15px;
        }

        .price-currency {
          color: #3b82f6;
        }

        .ride-type {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .ride-type.intercity {
          background: #fef3c7;
          color: #92400e;
        }

        .status-select {
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          color: #1e293b;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }

        .status-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .status-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status-updating {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
        }

        .update-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
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

        .dark-mode .admin-bookings-container {
          background: #111827;
        }

        .dark-mode .admin-header,
        .dark-mode .stat-card,
        .dark-mode .table-container,
        .dark-mode .pagination,
        .dark-mode .controls-panel {
          background: #1f2937;
          border-color: #374151;
        }

        .dark-mode .admin-title,
        .dark-mode .stat-value,
        .dark-mode .table-body td,
        .dark-mode .user-name,
        .dark-mode .price-cell {
          color: #f9fafb;
        }

        .dark-mode .stat-label,
        .dark-mode .admin-header p,
        .dark-mode .table-header th,
        .dark-mode .user-email,
        .dark-mode .page-info {
          color: #9ca3af !important;
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
        .dark-mode .filter-select,
        .dark-mode .sort-select,
        .dark-mode .dir-button,
        .dark-mode .status-select {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .dark-mode .search-input:focus,
        .dark-mode .filter-select:focus,
        .dark-mode .sort-select:focus,
        .dark-mode .status-select:focus {
          border-color: #3b82f6;
        }

        .dark-mode .dir-button {
          background: #374151;
          color: #f9fafb;
        }

        .dark-mode .dir-button:hover {
          background: #4b5563;
        }

        .dark-mode .table-header {
          background: #374151;
        }

        .dark-mode .table-body tr:hover {
          background: #374151;
        }

        .dark-mode .table-body td {
          border-color: #374151;
        }

        .dark-mode .error-message {
          background: #7f1d1d;
          border-color: #991b1b;
          color: #fecaca;
        }

        @media (max-width: 768px) {
          .admin-bookings-container {
            padding: 16px;
          }

          .admin-header {
            padding: 20px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .controls-panel {
            padding: 20px;
          }

          .table-body td {
            padding: 12px 16px;
          }
        }

        @media (max-width: 480px) {
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
            <h1 className="admin-title">Управление бронированиями</h1>
            <AdminThemeButtons />
          </div>
          <p style={{color: '#64748b', fontSize: '15px', margin: 0}}>
            Контроль всех бронирований и их статусов
          </p>
        </header>

        {data && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{data.total || 0}</div>
              <div className="stat-label">Всего бронирований</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {data.data.filter(b => b.status === 'active').length}
              </div>
              <div className="stat-label">Активные</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {data.data.filter(b => b.status === 'completed').length}
              </div>
              <div className="stat-label">Завершенные</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {new Intl.NumberFormat('ru-RU').format(
                  data.data.reduce((sum, b) => sum + (b.price_rub || 0), 0)
                )} ₽
              </div>
              <div className="stat-label">Сумма за период</div>
            </div>
          </div>
        )}

        <div className="controls-panel">
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Поиск: имя, email или автомобиль..."
            className="search-input"
          />
          
          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="filter-select"
          >
            <option value="">Все статусы</option>
            <option value="booked">Забронировано</option>
            <option value="active">Активно</option>
            <option value="completed">Завершено</option>
            <option value="canceled">Отменено</option>
          </select>
          
          <div className="sort-group">
            <select 
              value={sort} 
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="sort-select"
            >
              <option value="start_at">Дата начала</option>
              <option value="created_at">Дата создания</option>
              <option value="price_rub">Цена</option>
              <option value="duration_minutes">Длительность</option>
              <option value="status">Статус</option>
              <option value="id">ID</option>
            </select>
            
            <button onClick={flipDir} className="dir-button">
              {dir === "asc" ? "↑ Возр." : "↓ Убыв."}
            </button>
          </div>
          
          <button onClick={load} className="refresh-button">
            <span>🔄</span> Обновить
          </button>
        </div>

        {err && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
            <p style={{color: '#64748b'}}>Загрузка бронирований...</p>
          </div>
        ) : !data ? null : (
          <>
            <div className="table-container">
              <table className="bookings-table">
                <thead className="table-header">
                  <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Автомобиль</th>
                    <th>Начало</th>
                    <th>Длит.</th>
                    <th>Тип</th>
                    <th>Стоимость</th>
                    <th>Статус</th>
                    <th>Смена статуса</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data.data.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: '#64748b'
                        }}>
                          #{b.id}
                        </span>
                      </td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{b.user?.name || 'Не указан'}</span>
                          <span className="user-email">{b.user?.email || '?'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{fontWeight: '500'}}>{b.car?.name || 'Не указан'}</div>
                      </td>
                      <td>{formatDate(b.start_at)}</td>
                      <td>
                        <span style={{
                          background: '#f0f9ff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {b.duration_minutes} мин
                        </span>
                      </td>
                      <td>
                        <span className={`ride-type ${b.ride_type}`}>
                          {b.ride_type === "intercity" ? "🚗 Межгород" : "🏙️ Город"}
                        </span>
                      </td>
                      <td className="price-cell">
                        {b.price_rub} <span className="price-currency">₽</span>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: `${getStatusColor(b.status)}15`,
                            color: getStatusColor(b.status)
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {busyId === b.id ? (
                          <div className="status-updating">
                            <div className="update-spinner"></div>
                            <span>Обновление...</span>
                          </div>
                        ) : (
                          <select
                            value={b.status}
                            onChange={(e) => setStatusRow(b, e.target.value)}
                            className="status-select"
                            style={{
                              borderColor: getStatusColor(b.status),
                              color: getStatusColor(b.status)
                            }}
                          >
                            <option value="booked">booked</option>
                            <option value="active">active</option>
                            <option value="completed">completed</option>
                            <option value="canceled">canceled</option>
                          </select>
                        )}
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
                &larr; Назад
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

