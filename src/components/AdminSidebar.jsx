import { NavLink } from "react-router-dom";
import "./adminSidebar.css";

const ITEMS = [
  { to: "/admin/users", label: "Пользователи" },
  { to: "/admin/cars", label: "Автопарк" },
  { to: "/admin/bookings", label: "Бронирования" },
  { to: "/admin/finance", label: "Финансы" },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">Разделы админки</div>

      <nav className="admin-sidebar-nav">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `admin-sidebar-link${isActive ? " active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <NavLink to="/" className="admin-sidebar-home">
        На главную
      </NavLink>
    </aside>
  );
}
