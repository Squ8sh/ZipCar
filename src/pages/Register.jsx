import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import "./authPages.css";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem("site-theme");
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

  return document.body.classList.contains("dark-mode") ? "dark" : "light";
}

function AuthThemeButtons() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", theme === "dark");
    document.body.classList.toggle("light-mode", theme === "light");
    window.localStorage.setItem("site-theme", theme);
  }, [theme]);

  return (
    <div className="auth-theme-switch" aria-label="Переключение темы">
      <button
        type="button"
        className={`auth-theme-button light${theme === "light" ? " active" : ""}`}
        onClick={() => setTheme("light")}
      >
        Светлая
      </button>
      <button
        type="button"
        className={`auth-theme-button dark${theme === "dark" ? " active" : ""}`}
        onClick={() => setTheme("dark")}
      >
        Темная
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate("/");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-card">
        <div className="auth-card-header">
          <Link to="/" className="auth-logo-link">
            ZipCar
          </Link>
          <AuthThemeButtons />
        </div>

        <span className="auth-kicker">Создание аккаунта</span>
        <h1>Регистрация</h1>
        <p className="auth-subtitle">
          Создайте профиль, чтобы бронировать автомобили, выбирать подходящий класс и хранить историю поездок.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Имя</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Введите имя"
              required
            />
          </label>

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Введите email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Пароль</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Придумайте пароль"
              required
            />
          </label>

          <label className="auth-field">
            <span>Подтверждение пароля</span>
            <input
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Повторите пароль"
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="auth-redirect">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </section>

      <aside className="auth-info-panel">
        <span className="auth-info-label">Преимущества</span>
        <h2>Один аккаунт для всех поездок ZipCar</h2>
        <p>
          После регистрации пользователь получает доступ к бронированию, просмотру статуса поездок и выбору автомобилей разных классов.
        </p>

        <div className="auth-feature-grid">
          <div className="auth-feature-card">
            <b>Эконом</b>
            <span>для ежедневных поездок</span>
          </div>
          <div className="auth-feature-card">
            <b>Комфорт</b>
            <span>для города и семьи</span>
          </div>
          <div className="auth-feature-card">
            <b>Бизнес</b>
            <span>для важных встреч</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
