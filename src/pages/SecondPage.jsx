import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCars } from "../api/cars";
import "./style-second.css";

const CLASS_LABEL = {
  economy: "Эконом",
  comfort: "Комфорт",
  business: "Бизнес",
  premium: "Премиум",
};

const CLASS_KEYS = ["economy", "comfort", "business", "premium"];

export default function SecondPage() {
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsError, setCarsError] = useState("");

  const [selectedClasses, setSelectedClasses] = useState({
    economy: false,
    comfort: false,
    business: false,
    premium: false,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFilteredOnly, setShowFilteredOnly] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCars() {
      try {
        setCarsLoading(true);
        setCarsError("");
        const data = await getCars();
        if (!mounted) return;
        setCars(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setCarsError(e?.response?.data?.message || "Не удалось загрузить автомобили");
      } finally {
        if (mounted) setCarsLoading(false);
      }
    }

    loadCars();

    return () => {
      mounted = false;
    };
  }, []);

  const modelList = useMemo(() => {
    const byModel = new Map();
    for (const car of cars) {
      const key = `${car.class || ""}|${car.name || ""}`;
      if (!byModel.has(key)) {
        byModel.set(key, { ...car, model_count: 1 });
      } else {
        byModel.get(key).model_count += 1;
      }
    }
    return Array.from(byModel.values());
  }, [cars]);

  const filteredCars = useMemo(() => {
    if (!showFilteredOnly) return modelList;
    const enabled = Object.keys(selectedClasses).filter((key) => selectedClasses[key]);
    if (enabled.length === 0) return modelList;
    return modelList.filter((car) => enabled.includes(car.class));
  }, [modelList, selectedClasses, showFilteredOnly]);

  function handleCheckboxChange(event) {
    const { name, checked } = event.target;
    setSelectedClasses((prev) => ({ ...prev, [name]: checked }));
  }

  function toggleTheme(theme) {
    if (theme === "dark") {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      setIsDarkMode(false);
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }

  return (
    <>
      <header>
        <div className="header-container">
          <Link to="/">
            <img src="./img/svg/Logo.svg" alt="Логотип ZipCar" />
          </Link>
          <button className="menu-toggle" onClick={() => setIsMenuOpen((v) => !v)} aria-label="Открыть меню">
            <span />
            <span />
            <span />
          </button>
          <div className={`header-right ${isMenuOpen ? "menu-open" : ""}`}>
            <nav className="nav-list">
              <ul className="site-navigation">
                <li className="site-navigation-item"><Link to="/">О нас</Link></li>
                <li className="site-navigation-item"><Link to="/">Правила</Link></li>
                <li className="site-navigation-item"><Link to="/">Тарифы</Link></li>
                <li className="site-navigation-item"><Link to="/">Помощь</Link></li>
                <li className="site-navigation-item">+7 (999) 162-79-25</li>
              </ul>
            </nav>
            <ul className="themes">
              <li>
                <button
                  className={`theme-button ${!isDarkMode ? "active" : ""} theme-button-light`}
                  type="button"
                  onClick={() => toggleTheme("light")}
                >
                  Светлая
                </button>
              </li>
              <li>
                <button
                  className={`theme-button ${isDarkMode ? "active" : ""} theme-button-dark`}
                  type="button"
                  onClick={() => toggleTheme("dark")}
                >
                  Темная
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <section className="rental-section">
        <h2>Наш автопарк</h2>
        <div className="rental-form">
          <p>Выберите класс автомобиля:</p>
          <div className="rental-options">
            {CLASS_KEYS.map((carClass) => (
              <div className="checkbox-wrapper" key={carClass}>
                <input
                  type="checkbox"
                  id={`cbx-${carClass}`}
                  name={carClass}
                  checked={selectedClasses[carClass]}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor={`cbx-${carClass}`} className="check">
                  <svg width="18px" height="18px" viewBox="0 0 18 18">
                    <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z" />
                    <polyline points="1 9 7 14 15 4" />
                  </svg>
                </label>
                <label htmlFor={`cbx-${carClass}`}>{CLASS_LABEL[carClass]}</label>
              </div>
            ))}
          </div>
          <button className="rental-button" onClick={() => setShowFilteredOnly(true)}>
            Показать
          </button>
        </div>
      </section>

      <section className="cars">
        {carsLoading && <p>Загрузка автомобилей...</p>}
        {!carsLoading && carsError && <p>{carsError}</p>}
        {!carsLoading && !carsError && filteredCars.length === 0 && <p>Автомобили не найдены.</p>}

        {!carsLoading && !carsError && filteredCars.map((car) => (
          <div key={car.id} className="card-all">
            <img src={car.img} alt={car.name} className="cards-img" />
            <p>Марка автомобиля: {car.name}</p>
            <p>Класс: {CLASS_LABEL[car.class] || car.class || "—"}</p>
            <p>Доступно автомобилей этой модели: {car.model_count || 1}</p>
            <p className="about-car">
              <b>Описание: </b>
              {car.description || "—"}
            </p>
            <Link to={`/booking/${car.id}`} className="book-link">
              <button className="book-button" type="button">
                Забронировать
              </button>
            </Link>
          </div>
        ))}
      </section>

      <div className="end">
        <Link to="/">
          <button className="back-btn">Назад на главную</button>
        </Link>
        <h3 className="end-screen">Автопарк еще будет пополняться!</h3>
      </div>
    </>
  );
}
