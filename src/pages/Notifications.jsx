import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { me, getNotifications, markNotificationRead, notificationAction } from "../api/auth";
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

function formatDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date;
  }
}

export default function NotificationsPage() {
  const nav = useNavigate();
  const [theme, setTheme] = usePageTheme();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await getNotifications(page);
      setData(res);
    } catch (e) {
      setErr(e?.response?.data?.message || "Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await me();
        if (!u) return nav("/login");
        setLoadingAuth(false);
      } catch {
        nav("/login");
      }
    })();
  }, [nav]);

  useEffect(() => {
    if (!loadingAuth) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth, page]);

  const onRead = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setErr("");
    try {
      await markNotificationRead(id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Не удалось отметить уведомление как прочитанное");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const onReplace = async (notifId, carId) => {
    setActionLoading((prev) => ({ ...prev, [`replace_${notifId}`]: true }));
    setErr("");
    try {
      await notificationAction(notifId, { action: "replace", car_id: carId });
      await load();
      alert("Выбор сохранен");
    } catch (e) {
      setErr(e?.response?.data?.message || "Не удалось выбрать замену автомобиля");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`replace_${notifId}`]: false }));
    }
  };

  const onCancel = async (notifId) => {
    setActionLoading((prev) => ({ ...prev, [`cancel_${notifId}`]: true }));
    setErr("");
    try {
      await notificationAction(notifId, { action: "cancel" });
      await load();
      alert("Действие выполнено");
    } catch (e) {
      setErr(e?.response?.data?.message || "Не удалось отменить бронь");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`cancel_${notifId}`]: false }));
    }
  };

  const pageClassName = `account-page${theme === "dark" ? " account-page--dark" : ""}`;

  if (loadingAuth) {
    return (
      <div className={pageClassName}>
        <div className="account-shell">
          <div className="account-empty">
            <div className="account-empty-icon">🔐</div>
            <h2 className="account-section-title" style={{ justifyContent: "center" }}>
              Проверка авторизации...
            </h2>
            <p className="account-muted">После проверки откроется список уведомлений.</p>
          </div>
        </div>
      </div>
    );
  }

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const typeCount = new Set(notifications.map((n) => n.type)).size;

  return (
    <div className={pageClassName}>
      <div className="account-shell account-shell--wide">
        <div className="account-layout">
          <AccountSidebar />

          <main className="account-main-content">
            <header className="account-hero">
          <div className="account-hero-row">
            <div>
              <div className="account-kicker">Центр событий</div>
              <h1 className="account-title">Уведомления</h1>
              <p className="account-lead">
                Важные сообщения по поездкам, бронированиям и замене автомобилей собраны в одном современном разделе.
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

        {loading ? (
          <div className="account-empty">
            <div className="account-empty-icon">⏳</div>
            <h2 className="account-section-title" style={{ justifyContent: "center" }}>
              Загрузка уведомлений...
            </h2>
          </div>
        ) : !data ? null : (
          <>
            <div className="account-stats">
              <div className="account-stat">
                <div className="account-stat-value">{data.total || 0}</div>
                <div className="account-stat-label">Всего</div>
              </div>
              <div className="account-stat">
                <div className="account-stat-value">{unreadCount}</div>
                <div className="account-stat-label">Новые</div>
              </div>
              <div className="account-stat">
                <div className="account-stat-value">{data.current_page} / {data.last_page}</div>
                <div className="account-stat-label">Страница</div>
              </div>
              <div className="account-stat">
                <div className="account-stat-value">{typeCount}</div>
                <div className="account-stat-label">Типов</div>
              </div>
            </div>

            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="account-empty">
                  <div className="account-empty-icon">📭</div>
                  <h2 className="account-section-title" style={{ justifyContent: "center" }}>
                    Уведомлений пока нет
                  </h2>
                  <p className="account-muted">
                    Когда появятся важные обновления по бронированиям, они отобразятся здесь.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <article key={n.id} className={`notification-card${!n.read_at ? " notification-card--unread" : ""}`}>
                    <div className="notification-head">
                      <div>
                        <h3 className="notification-title">
                          {n.type === "booking_affected" ? "🚗 " : "🔔 "}
                          {n.payload?.title || n.type}
                        </h3>
                        {!n.read_at && <span className="account-badge account-badge--info" style={{ marginTop: 10 }}>Новое</span>}
                      </div>
                      <div className="notification-date">{formatDate(n.created_at)}</div>
                    </div>

                    {n.payload?.text && <div className="notification-text">{n.payload.text}</div>}

                    {n.type === "booking_affected" && (
                      <div className="notification-booking-box">
                        <h4 className="account-section-title" style={{ fontSize: 18 }}>
                          <span>⚙️</span>Авто в брони недоступно
                        </h4>

                        <div className="account-info-grid">
                          <div className="account-info-item">
                            <div className="account-info-label">Исходное авто</div>
                            <div className="account-info-value">{n.payload?.old_car?.name || "—"}</div>
                            <div className="account-muted">Класс: {n.payload?.old_car?.class || "—"}</div>
                          </div>
                          <div className="account-info-item">
                            <div className="account-info-label">Недоступно до</div>
                            <div className="account-info-value">{n.payload?.maintenance_until || "—"}</div>
                          </div>
                        </div>

                        {Array.isArray(n.payload?.options) && n.payload.options.length > 0 ? (
                          <div style={{ marginTop: 16 }}>
                            <p className="account-muted" style={{ margin: "0 0 12px" }}>
                              Доступные варианты для замены:
                            </p>
                            <div className="notification-options">
                              {n.payload.options.map((c) => (
                                <div key={c.id} className="notification-option">
                                  <h4 className="notification-title" style={{ fontSize: 17 }}>{c.name}</h4>
                                  <p className="account-muted" style={{ margin: "6px 0 14px" }}>Класс: {c.class}</p>
                                  <button
                                    onClick={() => onReplace(n.id, c.id)}
                                    disabled={actionLoading[`replace_${n.id}`]}
                                    className="account-btn account-btn--primary"
                                    style={{ width: "100%" }}
                                  >
                                    {actionLoading[`replace_${n.id}`] ? "Отправка..." : "Выбрать"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="account-alert account-alert--error">
                            <span>🚫</span>
                            <span>На замену сейчас нет доступных машин.</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="notification-actions">
                      {!n.read_at && (
                        <button
                          onClick={() => onRead(n.id)}
                          disabled={actionLoading[n.id]}
                          className="account-btn account-btn--success"
                        >
                          {actionLoading[n.id] ? "Обработка..." : "Отметить как прочитанное"}
                        </button>
                      )}

                      {n.type === "booking_affected" && (
                        <button
                          onClick={() => onCancel(n.id)}
                          disabled={actionLoading[`cancel_${n.id}`]}
                          className="account-btn account-btn--danger"
                        >
                          {actionLoading[`cancel_${n.id}`] ? "Отправка..." : "Отменить бронь"}
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

            {data.last_page > 1 && (
              <div className="account-pagination">
                <button
                  disabled={!data.prev_page_url}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="account-btn"
                >
                  ← Назад
                </button>
                <span className="account-badge account-badge--info">
                  Страница {data.current_page} из {data.last_page}
                </span>
                <button
                  disabled={!data.next_page_url}
                  onClick={() => setPage((p) => p + 1)}
                  className="account-btn"
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        )}

        <section className="account-card account-card-pad" style={{ marginTop: 24 }}>
          <h2 className="account-section-title"><span>💡</span>Как работают уведомления</h2>
          <p className="account-muted">
            Система автоматически сообщает обо всех важных событиях: изменениях бронирования, переносах поездки,
            подтверждениях и отменах. Проверяйте уведомления регулярно, чтобы не пропустить актуальную бронь.
          </p>
        </section>
          </main>
        </div>
      </div>
    </div>
  );
}