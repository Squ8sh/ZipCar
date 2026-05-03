import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { me } from "../api/auth";

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

export default function AdminPanelPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await me();
        if (!u) return nav("/login");
        if (!u.is_admin) return nav("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  if (loading) return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <p>Проверка прав доступа...</p>
    </div>
  );

  return (
    <div className="admin-panel-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .admin-panel-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .admin-panel-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 16px;
        }

        .admin-title {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex: 1;
        }

        .admin-subtitle {
          font-size: 16px;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto 20px;
          line-height: 1.6;
        }

        .nav-button {
          display: inline-block;
          padding: 12px 28px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          font-size: 15px;
        }

        .nav-button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }

        .dashboard-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .dashboard-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
        }

        .card-icon {
          font-size: 48px;
          margin-bottom: 20px;
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f9ff;
          color: #3b82f6;
        }

        .card-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .card-description {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          flex-grow: 1;
        }

        .card-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 2px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-arrow {
          font-size: 20px;
          color: #3b82f6;
          transition: transform 0.3s ease;
        }

        .dashboard-card:hover .card-arrow {
          transform: translateX(6px);
        }

        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 20px;
        }

        .loader-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Dark theme styles */
        .dark-mode .admin-panel-container,
        .dark-mode .loader-container {
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: #f9fafb;
        }

        .dark-mode .admin-header,
        .dark-mode .dashboard-card,
        .dark-mode .stat-card {
          background: #1f2937;
          border-color: #374151;
        }

        .dark-mode .admin-title,
        .dark-mode .card-title,
        .dark-mode .stat-value {
          color: #f9fafb;
        }

        .dark-mode .admin-subtitle,
        .dark-mode .card-description,
        .dark-mode .stat-label {
          color: #9ca3af;
        }

        .dark-mode .nav-button {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .dark-mode .nav-button:hover {
          background: #4b5563;
        }

        .dark-mode .card-icon {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
        }

        .dark-mode .card-footer {
          border-color: #374151;
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .admin-panel-container {
            padding: 16px;
          }

          .admin-header {
            padding: 24px;
          }

          .admin-panel-header-top {
            flex-direction: column;
            align-items: stretch;
          }

          .admin-title {
            font-size: 28px;
            flex-direction: column;
            gap: 12px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .dashboard-card {
            padding: 24px;
          }

          .stats-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .stats-bar {
            grid-template-columns: 1fr;
          }

          .admin-title {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="admin-content">
        <header className="admin-header">
          <div className="admin-panel-header-top">
            <h1 className="admin-title">
              <span>👑</span>
              Панель администратора
            </h1>
            <AdminThemeButtons />
          </div>
          <p className="admin-subtitle">
            Управление всеми аспектами системы бронирования автомобилей. 
            Здесь вы можете контролировать пользователей, бронирования и автопарк.
          </p>
          <Link to="/" className="nav-button">← Вернуться на главную</Link>
        </header>

        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-value">3</div>
            <div className="stat-label">Основных раздела</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">∞</div>
            <div className="stat-label">Возможностей управления</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">100%</div>
            <div className="stat-label">Контроль системы</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <Link to="/admin/users" className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3 className="card-title">Управление пользователями</h3>
            <p className="card-description">
              Полный контроль над пользователями системы: просмотр профилей, 
              управление правами администратора, проверка статуса подтверждения 
              электронной почты и поиск по базе пользователей.
            </p>
            <div className="card-footer">
              <span>Перейти к управлению</span>
              <span className="card-arrow">→</span>
            </div>
          </Link>

          <Link to="/admin/bookings" className="dashboard-card">
            <div className="card-icon">📅</div>
            <h3 className="card-title">Управление бронированиями</h3>
            <p className="card-description">
              Мониторинг и управление всеми бронированиями: фильтрация по статусам, 
              изменение статусов бронирований, просмотр детальной информации 
              и поиск по пользователям и автомобилям.
            </p>
            <div className="card-footer">
              <span>Перейти к управлению</span>
              <span className="card-arrow">→</span>
            </div>
          </Link>

          <Link to="/admin/cars" className="dashboard-card">
            <div className="card-icon">🚗</div>
            <h3 className="card-title">Управление автопарком</h3>
            <p className="card-description">
              Полный контроль над автомобилями: добавление новых автомобилей в каталог, 
              управление статусами обслуживания, редактирование информации 
              и мониторинг доступности автомобилей.
            </p>
            <div className="card-footer">
              <span>Перейти к управлению</span>
              <span className="card-arrow">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}