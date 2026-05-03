import { NavLink } from "react-router-dom";
import "./accountPages.css";

const ACCOUNT_ITEMS = [
  { to: "/profile", label: "Профиль", hint: "Основная", icon: "👤" },
  { to: "/my-bookings", label: "Мои поездки", hint: "История", icon: "🚘" },
  { to: "/notifications", label: "Уведомления", hint: "События", icon: "🔔" },
  { to: "/second", label: "Арендовать авто", hint: "Новая поездка", icon: "➕" },
];

export default function AccountSidebar() {
  return (
    <aside className="account-side-menu">
      <div className="account-side-header">
        <div className="account-side-logo">Z</div>
        <div>
          <div className="account-side-title">Личный кабинет</div>
          <div className="account-side-subtitle">Разделы аккаунта</div>
        </div>
      </div>

      <nav className="account-side-nav" aria-label="Навигация личного кабинета">
        {ACCOUNT_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/profile"}
            className={({ isActive }) => `account-side-link${isActive ? " active" : ""}`}
          >
            <span className="account-side-icon">{item.icon}</span>
            <span className="account-side-text">
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </span>
          </NavLink>
        ))}
      </nav>

      <NavLink to="/" className="account-side-home">
        ← На главную
      </NavLink>
    </aside>
  );
}
