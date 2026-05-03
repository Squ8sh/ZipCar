import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  cancelMyBooking,
  completeMyBooking,
  createBookingReview,
  me,
  myBookings,
} from "../api/auth";
import { PARKING_SPOTS, parkingKey } from "../constants/parkingSpots";
import AccountSidebar from "./AccountSidebar";
import "./accountPages.css";

const STATUS_LABEL = {
  booked: "Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅР°",
  active: "Р’ РїРѕРµР·РґРєРµ",
  completed: "Р—Р°РІРµСЂС€РµРЅР°",
  canceled: "РћС‚РјРµРЅРµРЅР°",
};

const TARIFF_LABEL = {
  minute: "РџРѕРјРёРЅСѓС‚РЅРѕ",
  hour: "РџРѕС‡Р°СЃРѕРІРѕ",
  day: "РџРѕСЃСѓС‚РѕС‡РЅРѕ",
  open: "Р”Рѕ Р·Р°РІРµСЂС€РµРЅРёСЏ",
};

const CLASS_LABEL = {
  economy: "Р­РєРѕРЅРѕРј",
  comfort: "РљРѕРјС„РѕСЂС‚",
  business: "Р‘РёР·РЅРµСЃ",
  premium: "РџСЂРµРјРёСѓРј",
};

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

function fmtDate(date) {
  if (!date) return "вЂ”";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(value) {
  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

export default function MyBookingsPage() {
  const nav = useNavigate();
  const [theme, setTheme] = usePageTheme();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [reviewBusyId, setReviewBusyId] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewOpen, setReviewOpen] = useState({});
  const [completeOpen, setCompleteOpen] = useState({});
  const [completeParking, setCompleteParking] = useState({});
  const [expanded, setExpanded] = useState({});

  async function load() {
    setLoading(true);
    setErr("");
    try {
      await me();
      const res = await myBookings(page);
      setData(res);
    } catch (e) {
      if (e?.response?.status === 401) nav("/login");
      else setErr(e?.response?.data?.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїРѕРµР·РґРєРё");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function mergeBooking(updated) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: prev.data.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
      };
    });
  }

  async function onCancel(booking) {
    if (!window.confirm("РћС‚РјРµРЅРёС‚СЊ СЌС‚Рѕ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ?")) return;
    setBusyId(booking.id);
    setErr("");
    try {
      const updated = await cancelMyBooking(booking.id);
      mergeBooking(updated);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РјРµРЅРёС‚СЊ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ");
    } finally {
      setBusyId(null);
    }
  }

  function getInitialDropoffSpotId(booking) {
    const byBooking = PARKING_SPOTS.find(
      (spot) => parkingKey(spot.name, spot.address) === parkingKey(booking?.parking_name, booking?.parking_address)
    );
    return byBooking?.id || PARKING_SPOTS[0].id;
  }

  function getSelectedDropoffSpot(booking) {
    const spotId = completeParking[booking.id] || getInitialDropoffSpotId(booking);
    return PARKING_SPOTS.find((spot) => spot.id === spotId) || PARKING_SPOTS[0];
  }

  async function onComplete(booking) {
    const spot = getSelectedDropoffSpot(booking);
    if (!window.confirm("Р—Р°РІРµСЂС€РёС‚СЊ РїРѕРµР·РґРєСѓ СЃРµР№С‡Р°СЃ?")) return;
    setBusyId(booking.id);
    setErr("");
    try {
      const updated = await completeMyBooking(booking.id, {
        parking_name: spot.name,
        parking_address: spot.address,
        lat: spot.lat,
        lng: spot.lng,
      });
      mergeBooking(updated);
      setCompleteOpen((prev) => ({ ...prev, [booking.id]: false }));
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РІРµСЂС€РёС‚СЊ РїРѕРµР·РґРєСѓ");
    } finally {
      setBusyId(null);
    }
  }

  function getReviewDraft(bookingId) {
    return reviewDrafts[bookingId] || { text: "", rating: 5 };
  }

  function updateReviewDraft(bookingId, patch) {
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: { ...getReviewDraft(bookingId), ...patch },
    }));
  }

  async function onSubmitReview(booking) {
    const draft = getReviewDraft(booking.id);
    const text = (draft.text || "").trim();
    const rating = Number(draft.rating || 5);

    if (!text) {
      setErr("Р’РІРµРґРёС‚Рµ С‚РµРєСЃС‚ РѕС‚Р·С‹РІР° РїРµСЂРµРґ РѕС‚РїСЂР°РІРєРѕР№.");
      return;
    }

    setErr("");
    setReviewBusyId(booking.id);
    try {
      const created = await createBookingReview(booking.id, { text, rating });
      setReviewDrafts((prev) => ({ ...prev, [booking.id]: { text: "", rating: 5 } }));
      setReviewOpen((prev) => ({ ...prev, [booking.id]: false }));
      if (created?.id) {
        await load();
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РѕС‚Р·С‹РІ.");
    } finally {
      setReviewBusyId(null);
    }
  }

  const pageClassName = `account-page${theme === "dark" ? " account-page--dark" : ""}`;
  const bookings = data?.data || [];

  return (
    <div className={pageClassName}>
      <div className="account-shell account-shell--wide">
        <div className="account-layout">
          <AccountSidebar />

          <main className="account-main-content">
            <header className="account-hero">
              <div className="account-hero-row">
                <div>
                  <div className="account-kicker">РСЃС‚РѕСЂРёСЏ Р°СЂРµРЅРґС‹</div>
                  <h1 className="account-title">РњРѕРё РїРѕРµР·РґРєРё</h1>
                  <p className="account-lead">
                    РЎРїРёСЃРѕРє Р°РєС‚РёРІРЅС‹С…, Р·Р°РїР»Р°РЅРёСЂРѕРІР°РЅРЅС‹С… Рё Р·Р°РІРµСЂС€РµРЅРЅС‹С… РїРѕРµР·РґРѕРє СЃ Р±С‹СЃС‚СЂС‹Рј СѓРїСЂР°РІР»РµРЅРёРµРј
                    Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµРј.
                  </p>
                </div>

                <div className="account-hero-actions">
                  <div className="account-theme-switch" aria-label="РЎРјРµРЅР° С‚РµРјС‹">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`account-theme-btn${theme === "light" ? " is-active" : ""}`}
                    >
                      РЎРІРµС‚Р»Р°СЏ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`account-theme-btn${theme === "dark" ? " is-active" : ""}`}
                    >
                      РўРµРјРЅР°СЏ
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {err && (
              <div className="account-alert account-alert--error">
                <span>вљ пёЏ</span>
                <span>{err}</span>
              </div>
            )}

            {loading && (
              <div className="account-empty">
                <div className="account-empty-icon">вЏі</div>
                <h2 className="account-section-title" style={{ justifyContent: "center" }}>
                  Р—Р°РіСЂСѓР·РєР° РїРѕРµР·РґРѕРє...
                </h2>
              </div>
            )}

            {!loading && data && bookings.length === 0 && (
              <div className="account-empty">
                <div className="account-empty-icon">рџљ</div>
                <h2 className="account-section-title" style={{ justifyContent: "center" }}>
                  РџРѕРєР° РЅРµС‚ РїРѕРµР·РґРѕРє
                </h2>
                <p className="account-muted">РћС„РѕСЂРјРёС‚Рµ РїРµСЂРІРѕРµ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ РІ Р°РІС‚РѕРїР°СЂРєРµ.</p>
                <div className="notification-actions" style={{ justifyContent: "center" }}>
                  <Link to="/second" className="account-link-btn account-link-btn--primary">
                    РџРµСЂРµР№С‚Рё Рє Р°СЂРµРЅРґРµ
                  </Link>
                </div>
              </div>
            )}

            {!loading && data && bookings.length > 0 && (
              <>
                <div className="account-stats">
                  <div className="account-stat">
                    <div className="account-stat-value">{data.total || bookings.length}</div>
                    <div className="account-stat-label">Р’СЃРµРіРѕ РїРѕРµР·РґРѕРє</div>
                  </div>
                  <div className="account-stat">
                    <div className="account-stat-value">
                      {bookings.filter((b) => b.status === "active").length}
                    </div>
                    <div className="account-stat-label">РђРєС‚РёРІРЅС‹Рµ</div>
                  </div>
                  <div className="account-stat">
                    <div className="account-stat-value">
                      {bookings.filter((b) => b.status === "booked").length}
                    </div>
                    <div className="account-stat-label">Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅРѕ</div>
                  </div>
                  <div className="account-stat">
                    <div className="account-stat-value">
                      {data.current_page} / {data.last_page}
                    </div>
                    <div className="account-stat-label">РЎС‚СЂР°РЅРёС†Р°</div>
                  </div>
                </div>

                <div className="bookings-list">
                  {bookings.map((booking) => {
                    const isExpanded = !!expanded[booking.id];
                    const showFinish = booking.status === "active" && booking.can_finish;
                    const showCancel = booking.status === "booked" || booking.status === "active";
                    const isCompleteOpen = !!completeOpen[booking.id];
                    const selectedDropoff = getSelectedDropoffSpot(booking);
                    const isReviewOpen = !!reviewOpen[booking.id];
                    const reviewData = booking.review || booking.feedback || null;
                    const reviewText =
                      reviewData?.text || reviewData?.comment || booking.review_text || "";
                    const hasReview = Boolean(reviewText);
                    const draft = getReviewDraft(booking.id);

                    return (
                      <article
                        key={booking.id}
                        className={`booking-card status-${booking.status || "booked"}`}
                      >
                        <div className="booking-head">
                          <div>
                            <h3 className="booking-title">
                              {booking.car?.name || `РђРІС‚Рѕ #${booking.car_id}`}
                            </h3>
                            <div className="booking-meta">
                              РљР»Р°СЃСЃ:{" "}
                              {CLASS_LABEL[booking.car?.class] || booking.car?.class || "вЂ”"} В·
                              Р“РѕСЃРЅРѕРјРµСЂ: {booking.car?.plate_number || "вЂ”"}
                            </div>
                          </div>
                          <div className="booking-status">
                            {STATUS_LABEL[booking.status] || booking.status}
                          </div>
                        </div>

                        <div className="booking-meta-grid">
                          <div className="booking-meta-item">
                            <span className="account-muted">РќР°С‡Р°Р»Рѕ Р°СЂРµРЅРґС‹</span>
                            <b>{fmtDate(booking.start_at)}</b>
                          </div>
                          <div className="booking-meta-item">
                            <span className="account-muted">РўР°СЂРёС„</span>
                            <b>
                              {TARIFF_LABEL[booking.tariff_mode] || booking.tariff_mode}{" "}
                              {booking.tariff_value ? `(${booking.tariff_value})` : ""}
                            </b>
                          </div>
                          <div className="booking-meta-item">
                            <span className="account-muted">РўРµРєСѓС‰Р°СЏ СЃСѓРјРјР°</span>
                            <b>
                              {fmtMoney(
                                booking.current_total_rub ??
                                  booking.final_price_rub ??
                                  booking.price_rub
                              )}{" "}
                              в‚Ѕ
                            </b>
                          </div>
                        </div>

                        {!booking.ends_on_user_action &&
                          booking.status === "active" &&
                          typeof booking.minutes_to_end === "number" &&
                          booking.minutes_to_end <= 10 &&
                          booking.minutes_to_end >= 0 && (
                            <p className="account-warning-text" style={{ marginTop: 14 }}>
                              Р”Рѕ РєРѕРЅС†Р° Р°СЂРµРЅРґС‹ РѕСЃС‚Р°Р»РѕСЃСЊ {booking.minutes_to_end} РјРёРЅ. Р”РѕСЃС‚СѓРїРЅРѕ
                              Р·Р°РІРµСЂС€РµРЅРёРµ РїРѕРµР·РґРєРё.
                            </p>
                          )}

                        {!booking.ends_on_user_action &&
                          booking.status === "active" &&
                          typeof booking.minutes_to_end === "number" &&
                          booking.minutes_to_end < 0 && (
                            <p className="account-danger-text" style={{ marginTop: 14 }}>
                              РџСЂРѕСЃСЂРѕС‡РєР°: {Math.abs(booking.minutes_to_end)} РјРёРЅ. РЁС‚СЂР°С„:{" "}
                              {fmtMoney(booking.current_penalty_rub)} в‚Ѕ
                            </p>
                          )}

                        <div className="booking-actions">
                          {showCancel && (
                            <button
                              onClick={() => onCancel(booking)}
                              disabled={busyId === booking.id}
                              className="account-btn account-btn--danger"
                            >
                              {busyId === booking.id ? "РћР±СЂР°Р±РѕС‚РєР°..." : "РћС‚РјРµРЅРёС‚СЊ Р±СЂРѕРЅСЊ"}
                            </button>
                          )}
                          {showFinish && (
                            <button
                              onClick={() =>
                                setCompleteOpen((prev) => ({ ...prev, [booking.id]: !prev[booking.id] }))
                              }
                              disabled={busyId === booking.id}
                              className="account-btn account-btn--success"
                            >
                              {busyId === booking.id
                                ? "РћР±СЂР°Р±РѕС‚РєР°..."
                                : isCompleteOpen
                                  ? "РЎРєСЂС‹С‚СЊ С„РѕСЂРјСѓ Р·Р°РІРµСЂС€РµРЅРёСЏ"
                                  : "Р—Р°РІРµСЂС€РёС‚СЊ РїРѕРµР·РґРєСѓ"}
                            </button>
                          )}
                          {booking.status === "completed" && !hasReview && (
                            <button
                              onClick={() =>
                                setReviewOpen((prev) => ({ ...prev, [booking.id]: !prev[booking.id] }))
                              }
                              className="account-btn account-btn--primary"
                            >
                              {isReviewOpen ? "РЎРєСЂС‹С‚СЊ С„РѕСЂРјСѓ РѕС‚Р·С‹РІР°" : "РћСЃС‚Р°РІРёС‚СЊ РѕС‚Р·С‹РІ"}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setExpanded((prev) => ({ ...prev, [booking.id]: !prev[booking.id] }))
                            }
                            className="account-btn"
                          >
                            {isExpanded ? "РЎРєСЂС‹С‚СЊ РґРµС‚Р°Р»Рё" : "РџРѕРґСЂРѕР±РЅРµРµ"}
                          </button>
                        </div>

                        {showFinish && isCompleteOpen && (
                          <div className="booking-review booking-review-form">
                            <label className="account-label">Где вы оставили автомобиль</label>
                            <div className="parking-list">
                              {PARKING_SPOTS.map((spot) => (
                                <label
                                  key={`${booking.id}-${spot.id}`}
                                  className={`parking-item ${selectedDropoff.id === spot.id ? "active" : ""}`}
                                >
                                  <input
                                    type="radio"
                                    name={`complete-spot-${booking.id}`}
                                    value={spot.id}
                                    checked={selectedDropoff.id === spot.id}
                                    onChange={() =>
                                      setCompleteParking((prev) => ({ ...prev, [booking.id]: spot.id }))
                                    }
                                  />
                                  <div>
                                    <strong>{spot.name}</strong>
                                    <p>{spot.address}</p>
                                  </div>
                                </label>
                              ))}
                            </div>

                            <button
                              type="button"
                              className="account-btn account-btn--success"
                              onClick={() => onComplete(booking)}
                              disabled={busyId === booking.id}
                            >
                              {busyId === booking.id ? "Завершение..." : "Подтвердить завершение"}
                            </button>
                          </div>
                        )}

                        {isExpanded && (
                          <div className="booking-details">
                            <h4 className="account-section-title" style={{ fontSize: 18 }}>
                              <span>рџ“‹</span>Р”РµС‚Р°Р»Рё РїРѕРµР·РґРєРё
                            </h4>
                            <div className="account-info-grid">
                              <div className="account-info-item">
                                <div className="account-info-label">Р’РѕРґРёС‚РµР»СЊ</div>
                                <div className="account-info-value">{booking.driver_name || "вЂ”"}</div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">РўРёРї РїРѕРµР·РґРєРё</div>
                                <div className="account-info-value">
                                  {booking.ride_type === "intercity" ? "РњРµР¶РіРѕСЂРѕРґ (+10%)" : "Р“РѕСЂРѕРґ"}
                                </div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">РџР°СЂРєРѕРІРєР°</div>
                                <div className="account-info-value">{booking.parking_name || "вЂ”"}</div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">РђРґСЂРµСЃ РїР°СЂРєРѕРІРєРё</div>
                                <div className="account-info-value">
                                  {booking.parking_address || "вЂ”"}
                                </div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">РџР»Р°РЅРѕРІРѕРµ Р·Р°РІРµСЂС€РµРЅРёРµ</div>
                                <div className="account-info-value">{fmtDate(booking.planned_end_at)}</div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ Р·Р°РІРµСЂС€РµРЅРёРµ</div>
                                <div className="account-info-value">{fmtDate(booking.ended_at)}</div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">РџРµСЂРµРїСЂРѕР±РµРі</div>
                                <div className="account-info-value">
                                  {booking.overtime_minutes || 0} РјРёРЅ
                                </div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">РЁС‚СЂР°С„</div>
                                <div className="account-info-value">
                                  {fmtMoney(booking.overtime_penalty_rub || 0)} в‚Ѕ
                                </div>
                              </div>
                              <div className="account-info-item">
                                <div className="account-info-label">Р¤РёРЅР°Р»СЊРЅР°СЏ СЃСѓРјРјР°</div>
                                <div className="account-info-value">
                                  {fmtMoney(
                                    booking.final_price_rub ??
                                      booking.current_total_rub ??
                                      booking.price_rub
                                  )}{" "}
                                  в‚Ѕ
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {booking.status === "completed" && hasReview && (
                          <div className="booking-review booking-review-view">
                            <div className="account-muted" style={{ marginBottom: 8 }}>
                              РћС†РµРЅРєР°:{" "}
                              {Number(reviewData?.rating || booking.review_rating || 0) > 0
                                ? `${Number(reviewData?.rating || booking.review_rating)} / 5`
                                : "РЅРµ СѓРєР°Р·Р°РЅР°"}
                            </div>
                            <p>{reviewText}</p>
                          </div>
                        )}

                        {booking.status === "completed" && !hasReview && isReviewOpen && (
                          <div className="booking-review booking-review-form">
                            <label className="account-label" htmlFor={`review-rating-${booking.id}`}>
                              РћС†РµРЅРєР°
                            </label>
                            <select
                              id={`review-rating-${booking.id}`}
                              className="account-input"
                              value={draft.rating}
                              onChange={(e) =>
                                updateReviewDraft(booking.id, { rating: Number(e.target.value) })
                              }
                            >
                              <option value={5}>5</option>
                              <option value={4}>4</option>
                              <option value={3}>3</option>
                              <option value={2}>2</option>
                              <option value={1}>1</option>
                            </select>

                            <label className="account-label" htmlFor={`review-text-${booking.id}`}>
                              РљРѕРјРјРµРЅС‚Р°СЂРёР№
                            </label>
                            <textarea
                              id={`review-text-${booking.id}`}
                              className="account-input booking-review-textarea"
                              placeholder="РќР°РїРёС€РёС‚Рµ, РєР°Рє РїСЂРѕС€Р»Р° РїРѕРµР·РґРєР°..."
                              value={draft.text}
                              onChange={(e) => updateReviewDraft(booking.id, { text: e.target.value })}
                            />

                            <button
                              type="button"
                              className="account-btn account-btn--primary"
                              onClick={() => onSubmitReview(booking)}
                              disabled={reviewBusyId === booking.id}
                            >
                              {reviewBusyId === booking.id ? "РЎРѕС…СЂР°РЅРµРЅРёРµ..." : "РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ РѕС‚Р·С‹РІ"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                {data.last_page > 1 && (
                  <div className="account-pagination">
                    <button
                      disabled={!data.prev_page_url}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="account-btn"
                    >
                      в†ђ РќР°Р·Р°Рґ
                    </button>
                    <span className="account-badge account-badge--info">
                      РЎС‚СЂР°РЅРёС†Р° {data.current_page} РёР· {data.last_page}
                    </span>
                    <button
                      disabled={!data.next_page_url}
                      onClick={() => setPage((p) => p + 1)}
                      className="account-btn"
                    >
                      Р’РїРµСЂРµРґ
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}


