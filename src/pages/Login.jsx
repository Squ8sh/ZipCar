import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
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

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
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
    setLoading(true);

    try {
      await login(form);
      navigate("/");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Ошибка входа");
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

        <span className="auth-kicker">Личный кабинет</span>
        <h1>Вход в аккаунт</h1>
        <p className="auth-subtitle">
          Авторизуйтесь, чтобы управлять бронированиями, смотреть историю поездок и быстрее выбирать автомобиль.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="Введите пароль"
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="auth-redirect">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </section>

      <aside className="auth-info-panel">
        <span className="auth-info-label">ZipCar</span>
        <h2>Каршеринг для поездок по городу и за его пределами</h2>
        <p>
          В личном кабинете можно быстро перейти к аренде, выбрать класс автомобиля и отслеживать свои бронирования.
        </p>

        <div className="auth-feature-grid">
          <div className="auth-feature-card">
            <b>24/7</b>
            <span>доступ к автомобилям</span>
          </div>
          <div className="auth-feature-card">
            <b>4</b>
            <span>класса автомобилей</span>
          </div>
          <div className="auth-feature-card">
            <b>Online</b>
            <span>быстрое бронирование</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
