import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  profile,
  updateProfile,
  changePassword,
  uploadAvatar,
  sendEmailCode,
  verifyEmailCode,
} from "../api/auth";
import AccountSidebar from "./AccountSidebar";
import "./accountPages.css";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("site-theme");
  if (saved === "dark" || saved === "light") return saved;
  return document.body.classList.contains("dark-mode") ? "dark" : "light";
}

function usePageTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem("site-theme", theme);
    document.body.classList.toggle("dark-mode", theme === "dark");
    document.body.classList.toggle("light-mode", theme === "light");
  }, [theme]);

  return [theme, setTheme];
}

export default function ProfilePage() {
  const nav = useNavigate();
  const [theme, setTheme] = usePageTheme();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [code, setCode] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const avatarUrl = useMemo(() => {
    if (!user?.avatar_path) return null;
    if (String(user.avatar_path).startsWith("http")) return user.avatar_path;
    return `http://localhost:8000/storage/${user.avatar_path}`;
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const u = await profile();
        setUser(u);
        setName(u.name || "");
        setEmail(u.email || "");
        setDob(u.date_of_birth || "");
      } catch (e) {
        if (e?.response?.status === 401) nav("/login");
        else setErr("Не удалось загрузить профиль");
      }
    })();
  }, [nav]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setSaving(true);

    try {
      const u = await updateProfile({
        name,
        email,
        date_of_birth: dob || null,
      });

      setUser(u);
      setName(u.name || "");
      setEmail(u.email || "");
      setDob(u.date_of_birth || "");
      setOk("Профиль обновлён");
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        (e2?.response?.data?.errors
          ? Object.values(e2.response.data.errors).flat().join("\n")
          : null) ||
        "Ошибка сохранения";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (newPassword !== newPassword2) {
      setErr("Новый пароль и подтверждение не совпадают");
      return;
    }

    setSaving(true);

    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword2,
      });

      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
      setOk("Пароль изменён");
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        (e2?.response?.data?.errors
          ? Object.values(e2.response.data.errors).flat().join("\n")
          : null) ||
        "Ошибка смены пароля";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr("");
    setOk("");
    setSaving(true);

    try {
      const u = await uploadAvatar(file);
      setUser(u);
      setOk("Аватар обновлён");
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        (e2?.response?.data?.errors
          ? Object.values(e2.response.data.errors).flat().join("\n")
          : null) ||
        "Ошибка загрузки аватара";
      setErr(msg);
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const handleSendCode = async () => {
    if (sendingCode) return;

    setErr("");
    setOk("");
    setSendingCode(true);

    try {
      const res = await sendEmailCode();

      if (res?.debug_code) {
        setCode(String(res.debug_code));
        setOk(`SMTP недоступен. Код для входа: ${res.debug_code}`);
      } else {
        setOk(res?.message || "Код подтверждения отправлен на вашу почту.");
      }
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Не удалось отправить код подтверждения");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyingCode || code.length !== 6) return;

    setErr("");
    setOk("");
    setVerifyingCode(true);

    try {
      const u = await verifyEmailCode(code);
      setUser(u);
      setCode("");
      setOk("Почта успешно подтверждена! ✅");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Неверный код");
    } finally {
      setVerifyingCode(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Не указана";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const pageClassName = `account-page${theme === "dark" ? " account-page--dark" : ""}`;

  if (!user) {
    return (
      <div className={pageClassName}>
        <div className="account-shell">
          <div className="account-empty">
            <div className="account-empty-icon">🚘</div>
            <h2 className="account-section-title" style={{ justifyContent: "center" }}>
              Загрузка профиля...
            </h2>
            <p className="account-muted">Проверяем данные аккаунта и настройки пользователя.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      <div className="account-shell account-shell--wide">
        <div className="account-layout">
          <AccountSidebar />

          <main className="account-main-content">
            <header className="account-hero">
          <div className="account-hero-row">
            <div>
              <div className="account-kicker">Личный кабинет</div>
              <h1 className="account-title">Мой профиль</h1>
              <p className="account-lead">
                Здесь можно обновить личные данные, аватар, пароль и подтверждение почты. Все функции страницы сохранены.
              </p>
            </div>

            <div className="account-hero-actions">
              <div className="account-theme-switch" aria-label="Смена темы">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`account-theme-btn${theme === "light" ? " is-active" : ""}`}
                >
                  Светлая
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`account-theme-btn${theme === "dark" ? " is-active" : ""}`}
                >
                  Темная
                </button>
              </div>
            </div>
          </div>
        </header>

        {err && (
          <div className="account-alert account-alert--error">
            <span>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        {ok && (
          <div className="account-alert account-alert--success">
            <span>✅</span>
            <span>{ok}</span>
          </div>
        )}

        <div className="account-grid">
          <aside className="account-card profile-sidebar">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-empty">
                  <div>
                    <strong>👤</strong>
                    Нет фото
                  </div>
                </div>
              )}
            </div>

            <div className="profile-upload">
              <input
                type="file"
                accept="image/*"
                onChange={onAvatar}
                disabled={saving}
                className="profile-file-input"
                id="avatarUpload"
              />
              <label htmlFor="avatarUpload" className="account-btn account-btn--primary profile-upload-label">
                {saving ? "Загрузка..." : "Сменить аватар"}
              </label>
            </div>

            <div className="profile-mini-list">
              <div className="profile-mini-item">
                <span>Имя</span>
                <span>{user.name || "Не указано"}</span>
              </div>
              <div className="profile-mini-item">
                <span>Почта</span>
                <span>{user.email || "Не указана"}</span>
              </div>
              <div className="profile-mini-item">
                <span>Поездок</span>
                <span>{user.total_bookings || 0}</span>
              </div>
              <div className="profile-mini-item">
                <span>Регистрация</span>
                <span>{formatDate(user.created_at)}</span>
              </div>
            </div>
          </aside>

          <main className="profile-main">
            <section className="account-card account-card-pad">
              <h2 className="account-section-title"><span>📝</span>Личные данные</h2>
              <form onSubmit={saveProfile} className="account-form-grid">
                <div className="account-field">
                  <label className="account-label">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="account-input"
                    placeholder="Введите ваше имя"
                    disabled={saving}
                  />
                </div>

                <div className="account-field">
                  <label className="account-label">Электронная почта</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="account-input"
                    placeholder="email@example.com"
                    disabled={saving}
                  />
                </div>

                <div className="account-field">
                  <label className="account-label">Дата рождения</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="account-input"
                    disabled={saving}
                  />
                </div>

                <div className="account-field account-field--wide">
                  <button type="submit" className="account-btn account-btn--primary" disabled={saving}>
                    {saving ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                </div>
              </form>
            </section>

            <section className="account-card account-card-pad">
              <h2 className="account-section-title"><span>🔐</span>Безопасность</h2>
              <p className="account-muted">
                Текущий пароль показать нельзя, потому что он хранится в зашифрованном виде. Здесь можно безопасно задать новый пароль.
              </p>

              <div className="notification-actions">
                <button type="button" onClick={() => setShowPass((v) => !v)} className="account-btn account-btn--warning">
                  {showPass ? "Скрыть настройки пароля" : "Изменить пароль"}
                </button>
              </div>

              {showPass && (
                <form onSubmit={savePassword} className="account-form-grid" style={{ marginTop: 18 }}>
                  <div className="account-field">
                    <label className="account-label">Текущий пароль</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="account-input"
                      placeholder="••••••••"
                      disabled={saving}
                    />
                  </div>

                  <div className="account-field">
                    <label className="account-label">Новый пароль</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="account-input"
                      placeholder="••••••••"
                      disabled={saving}
                    />
                  </div>

                  <div className="account-field">
                    <label className="account-label">Повторите пароль</label>
                    <input
                      type="password"
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                      className="account-input"
                      placeholder="••••••••"
                      disabled={saving}
                    />
                  </div>

                  <div className="account-field account-field--wide">
                    <button type="submit" className="account-btn account-btn--primary" disabled={saving}>
                      {saving ? "Сохранение..." : "Обновить пароль"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="account-card account-card-pad">
              <div className="verification-head">
                <h2 className="account-section-title" style={{ margin: 0 }}><span>✉️</span>Подтверждение аккаунта</h2>
                <span className={`account-badge ${user.email_verified_at ? "account-badge--success" : "account-badge--danger"}`}>
                  {user.email_verified_at ? "Подтверждён" : "Не подтверждён"}
                </span>
              </div>

              {!user.email_verified_at && (
                <div className="verification-actions">
                  <p className="account-muted">
                    Подтвердите электронную почту, чтобы получить полный доступ ко всем возможностям сервиса.
                  </p>

                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || saving}
                    className="account-btn account-btn--warning"
                  >
                    {sendingCode ? "Отправка..." : "Отправить код подтверждения"}
                  </button>

                  <div className="account-form-grid">
                    <div className="account-field">
                      <label className="account-label">Код из письма</label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="account-input account-code-input"
                        maxLength="6"
                        pattern="[0-9]*"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="account-field" style={{ alignSelf: "end" }}>
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={saving || verifyingCode || code.length !== 6}
                        className="account-btn account-btn--primary"
                      >
                        {verifyingCode ? "Проверка..." : "Подтвердить"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {user.email_verified_at && (
                <div className="account-alert account-alert--success" style={{ marginTop: 0 }}>
                  <span>✅</span>
                  <span>Ваша почта подтверждена.</span>
                </div>
              )}
            </section>
          </main>
        </div>
          </main>
        </div>
      </div>
    </div>
  );
}