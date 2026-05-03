import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminUsers, me, setUserAdmin, setUserBlocked } from "../api/auth";
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

export default function AdminUsersPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("id");
  const [dir, setDir] = useState("desc");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState({ id: null, action: null });

  const debouncedQ = useMemo(() => q.trim(), [q]);

  const load = async () => {
    setErr("");
    setLoading(true);

    try {
      const u = await me();
      if (!u) {
        nav("/login");
        return;
      }
      if (!u.is_admin) {
        nav("/");
        return;
      }

      const res = await adminUsers({ q: debouncedQ, sort, dir, page });
      setData(res);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) nav("/login");
      else if (status === 403) nav("/");
      else setErr(e?.response?.data?.message || "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, dir, debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [q, sort, dir]);

  const toggleAdmin = async (u) => {
    setBusy({ id: u.id, action: "admin" });
    setErr("");
    try {
      const updated = await setUserAdmin(u.id, !u.is_admin);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
        };
      });
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          (e?.response?.data?.errors
            ? Object.values(e.response.data.errors).flat().join("\n")
            : null) ||
          "Ошибка изменения роли"
      );
    } finally {
      setBusy({ id: null, action: null });
    }
  };

  const toggleBlocked = async (u) => {
    setBusy({ id: u.id, action: "block" });
    setErr("");
    try {
      const isBlocking = !u.is_blocked;
      let reason = null;

      if (isBlocking) {
        reason = window.prompt("Причина блокировки (необязательно):", "")?.trim() || null;
      }

      const updated = await setUserBlocked(u.id, isBlocking, reason);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
        };
      });
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          (e?.response?.data?.errors
            ? Object.values(e.response.data.errors).flat().join("\n")
            : null) ||
          "Ошибка изменения блокировки"
      );
    } finally {
      setBusy({ id: null, action: null });
    }
  };

  const flipDir = () => setDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div className="admin-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .admin-container {
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
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
          padding: 24px 32px;
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
          content: "👥";
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

        .controls-panel {
          background: #f1f5f9;
          border-radius: 16px;
          padding: 20px;
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (min-width: 1024px) {
          .controls-panel {
            grid-template-columns: 1fr auto auto auto;
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

        .sort-select {
          padding: 12px 20px;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          font-size: 15px;
          color: #1e293b;
          background: white;
          min-width: 150px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
        }

        .sort-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .dir-button {
          padding: 12px 24px;
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
          min-width: 120px;
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
          border: 1px solid #fecaca;
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

        .error-icon {
          font-size: 20px;
          flex-shrink: 0;
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
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .table-header {
          background: #f1f5f9;
        }

        .table-header th {
          padding: 18px 20px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 14px;
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
          border-bottom: 1px solid #f1f5f9;
        }

        .admin-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-yes {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-no {
          background: #f1f5f9;
          color: #475569;
        }

        .verified-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .verified-yes {
          background: #e0f2fe;
          color: #0369a1;
        }

        .verified-no {
          background: #fee2e2;
          color: #dc2626;
        }

        .blocked-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .blocked-yes {
          background: #fee2e2;
          color: #dc2626;
        }

        .blocked-no {
          background: #dcfce7;
          color: #166534;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .toggle-button {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          min-width: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .toggle-button.admin {
          background: #fee2e2;
          color: #dc2626;
        }

        .toggle-button.admin:hover:not(:disabled) {
          background: #fecaca;
          transform: translateY(-1px);
        }

        .toggle-button.user {
          background: #d1fae5;
          color: #065f46;
        }

        .toggle-button.user:hover:not(:disabled) {
          background: #a7f3d0;
          transform: translateY(-1px);
        }

        .toggle-button.block {
          background: #fee2e2;
          color: #dc2626;
        }

        .toggle-button.block:hover:not(:disabled) {
          background: #fecaca;
          transform: translateY(-1px);
        }

        .toggle-button.unblock {
          background: #dcfce7;
          color: #166534;
        }

        .toggle-button.unblock:hover:not(:disabled) {
          background: #bbf7d0;
          transform: translateY(-1px);
        }

        .toggle-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mobile-only {
          display: block;
        }

        .desktop-only {
          display: none;
        }

        @media (min-width: 768px) {
          .mobile-only {
            display: none;
          }
          .desktop-only {
            display: block;
          }
        }


        .dark-mode .admin-container {
          background: #111827;
        }

        .dark-mode .admin-header,
        .dark-mode .stat-card,
        .dark-mode .table-container,
        .dark-mode .pagination,
        .dark-mode .controls-panel,
        .dark-mode .loader {
          background: #1f2937;
          border-color: #374151;
        }

        .dark-mode .admin-title,
        .dark-mode .stat-value,
        .dark-mode .table-body td {
          color: #f9fafb;
        }

        .dark-mode .admin-header p,
        .dark-mode .stat-label,
        .dark-mode .table-header th,
        .dark-mode .page-info,
        .dark-mode .loader p {
          color: #9ca3af !important;
        }

        .dark-mode .search-input,
        .dark-mode .sort-select,
        .dark-mode .dir-button {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .dark-mode .search-input::placeholder {
          color: #9ca3af;
        }

        .dark-mode .search-input:focus,
        .dark-mode .sort-select:focus {
          border-color: #3b82f6;
        }

        .dark-mode .dir-button:hover {
          background: #4b5563;
        }

        .dark-mode .table-header {
          background: #374151;
        }

        .dark-mode .table-body tr {
          border-color: #374151;
        }

        .dark-mode .table-body tr:hover {
          background: #374151;
        }

        .dark-mode .table-body td {
          border-color: #374151;
        }

        .dark-mode .badge-no {
          background: #374151;
          color: #d1d5db;
        }

        .dark-mode .error-message {
          background: #7f1d1d;
          border-color: #991b1b;
          color: #fecaca;
        }

        @media (max-width: 768px) {
          .admin-header {
            padding: 20px;
          }
          
          .controls-panel {
            padding: 16px;
          }
          
          .table-container {
            border-radius: 12px;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
        <header className="admin-header">
          <div className="header-top">
            <h1 className="admin-title">Управление пользователями</h1>
            <AdminThemeButtons />
          </div>
          <p style={{color: '#64748b', fontSize: '15px', margin: 0}}>
            Просмотр и управление учетными записями
          </p>
        </header>

        {data && (
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-value">{data.total || 0}</div>
              <div className="stat-label">Всего пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {data.data.filter(u => u.is_admin).length}
              </div>
              <div className="stat-label">Администраторы</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {data.data.filter(u => u.email_verified_at).length}
              </div>
              <div className="stat-label">Подтвержденные</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {data.data.filter(u => u.is_blocked).length}
              </div>
              <div className="stat-label">Заблокированные</div>
            </div>
          </div>
        )}

        <div className="controls-panel">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="search-input"
          />
          
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="sort-select">
            <option value="id">ID</option>
            <option value="name">Имя</option>
            <option value="email">Email</option>
            <option value="is_admin">Роль</option>
            <option value="is_blocked">Блокировка</option>
            <option value="blocked_at">Дата блокировки</option>
            <option value="created_at">Дата регистрации</option>
          </select>
          
          <button onClick={flipDir} className="dir-button">
            {dir === "asc" ? "↑ По возрастанию" : "↓ По убыванию"}
          </button>
          
          <button onClick={load} className="refresh-button">
            <span>🔄</span> Обновить
          </button>
        </div>

        {err && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{err}</span>
          </div>
        )}

        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
            <p style={{color: '#64748b'}}>Загрузка списка пользователей...</p>
          </div>
        ) : !data ? null : (
          <>
            <div className="table-container">
              <table className="users-table">
                <thead className="table-header">
                  <tr>
                    <th>ID</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Дата регистрации</th>
                    <th>Верификация</th>
                    <th>Блокировка</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data.data.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '13px'
                        }}>
                          #{u.id}
                        </span>
                      </td>
                      <td>
                        <div style={{fontWeight: '500'}}>{u.name}</div>
                      </td>
                      <td>
                        <div style={{color: '#475569'}}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`admin-badge ${u.is_admin ? 'badge-yes' : 'badge-no'}`}>
                          {u.is_admin ? 'Да' : 'Нет'}
                        </span>
                      </td>
                      <td>
                        {new Date(u.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span className={`verified-badge ${u.email_verified_at ? 'verified-yes' : 'verified-no'}`}>
                          {u.email_verified_at ? 'Да' : 'Нет'}
                        </span>
                      </td>
                      <td>
                        <span className={`blocked-badge ${u.is_blocked ? 'blocked-yes' : 'blocked-no'}`}>
                          {u.is_blocked ? 'Заблокирован' : 'Активен'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => toggleAdmin(u)}
                            disabled={busy.id === u.id}
                            className={`toggle-button ${u.is_admin ? 'admin' : 'user'}`}
                          >
                            {busy.id === u.id && busy.action === "admin" ? (
                              <>
                                <div className="button-spinner"></div>
                                <span>Сохранение...</span>
                              </>
                            ) : u.is_admin ? (
                              'Снять права'
                            ) : (
                              'Сделать админом'
                            )}
                          </button>
                          <button
                            onClick={() => toggleBlocked(u)}
                            disabled={busy.id === u.id}
                            className={`toggle-button ${u.is_blocked ? 'unblock' : 'block'}`}
                          >
                            {busy.id === u.id && busy.action === "block" ? (
                              <>
                                <div className="button-spinner"></div>
                                <span>Сохранение...</span>
                              </>
                            ) : u.is_blocked ? (
                              'Разблокировать'
                            ) : (
                              'Заблокировать'
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


