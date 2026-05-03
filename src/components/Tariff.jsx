import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicReviews } from "../api/auth";
import "./style.css";

function Tariff() {
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const carClasses = [
    {
      title: "Эконом",
      description:
        "Доступные автомобили для ежедневных городских поездок. Подходят для коротких маршрутов, поездок на работу и передвижения по делам без лишних затрат.",
    },
    {
      title: "Комфорт",
      description:
        "Более просторные и удобные автомобили для спокойных поездок по городу и за его пределами. Хороший вариант для тех, кому важны удобство и практичность.",
    },
    {
      title: "Бизнес",
      description:
        "Автомобили повышенного класса с современным оснащением и высоким уровнем комфорта. Подходят для деловых встреч, важных поездок и представительских задач.",
    },
    {
      title: "Премиум",
      description:
        "Автомобили высокого уровня для тех, кто ценит максимальный комфорт, стиль и статус. Подходят для особых случаев, мероприятий и поездок с повышенными требованиями.",
    },
  ];

  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      try {
        setReviewsLoading(true);
        const data = await getPublicReviews(12);
        if (!mounted) return;

        const normalized = (Array.isArray(data) ? data : [])
          .map((review, index) => {
            const text = review?.text || review?.comment || review?.review_text || "";
            if (!text) return null;

            return {
              id: review?.id ?? `review-${index}`,
              name: review?.user_name || review?.user?.name || "Пользователь ZipCar",
              car: review?.car_label || review?.car_name || review?.car?.name || "Автомобиль ZipCar",
              text,
              rating: Number(review?.rating || 0),
            };
          })
          .filter(Boolean);

        setReviews(normalized);
      } catch {
        if (!mounted) return;
        setReviews([]);
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    }

    loadReviews();
    return () => {
      mounted = false;
    };
  }, []);

  const reviewCards = useMemo(() => {
    if (reviews.length === 0) return [];
    return [...reviews, ...reviews];
  }, [reviews]);

  const news = [
    {
      date: "12 июня",
      category: "Автопарк",
      title: "В сервисе появились новые автомобили комфорт-класса",
      text: "Мы добавили больше машин для ежедневных поездок, чтобы пользователям было проще найти свободный автомобиль рядом с домом или работой.",
    },
    {
      date: "18 июня",
      category: "Тарифы",
      title: "Запущены выгодные условия для длительной аренды",
      text: "Теперь поездки от суток стали удобнее: тариф автоматически подбирается под длительность аренды и помогает сэкономить на длинных маршрутах.",
    },
    {
      date: "25 июня",
      category: "Сервис",
      title: "Обновлена система проверки автомобилей перед поездкой",
      text: "В приложении стало проще отметить состояние машины, загрузить фото повреждений и быстро отправить информацию в поддержку.",
    },
    {
      date: "2 июля",
      category: "Города",
      title: "ZipCar расширяет зону завершения аренды",
      text: "В нескольких районах появились новые парковочные зоны, поэтому завершить поездку теперь можно ближе к популярным деловым и жилым кварталам.",
    },
    {
      date: "9 июля",
      category: "Премиум",
      title: "Премиум-класс стал доступен для особых поездок",
      text: "Для важных встреч и мероприятий добавлены автомобили высокого уровня с повышенным комфортом и расширенными требованиями к аренде.",
    },
  ];

  const goToPrevNews = () => {
    setActiveNewsIndex((currentIndex) => (currentIndex === 0 ? news.length - 1 : currentIndex - 1));
  };

  const goToNextNews = () => {
    setActiveNewsIndex((currentIndex) => (currentIndex === news.length - 1 ? 0 : currentIndex + 1));
  };

  return (
    <section id="tariff">
      <h2>Тарифы</h2>

      <div className="rate">
        <div className="tariff-classes">
          {carClasses.map((carClass) => (
            <article className="tariff-class-card" key={carClass.title}>
              <span className="tariff-class-label">Класс</span>
              <h3>{carClass.title}</h3>
              <p>{carClass.description}</p>
            </article>
          ))}
        </div>
      </div>

      <Link to="/second" className="all-cars">
        Посмотреть полный автопарк
      </Link>

      <div className="cards">
        <div className="card">
          <p>
            от <b>450 ₽</b>
          </p>
          <p>за каждый час до 24 часов аренды</p>
        </div>
        <div className="card">
          <p>
            от <b>9800 ₽</b>
          </p>
          <p>каждые 24 часа от 24 часов аренды</p>
        </div>
      </div>

      <section id="news" className="news-section" aria-label="Новости ZipCar">
        <div className="news-header">
          <div>
            <span className="section-kicker">Новости</span>
            <h2>Что нового в ZipCar</h2>
          </div>
          <div className="news-controls" aria-label="Управление слайдером новостей">
            <button className="news-arrow" type="button" onClick={goToPrevNews} aria-label="Предыдущая новость">
              ‹
            </button>
            <button className="news-arrow" type="button" onClick={goToNextNews} aria-label="Следующая новость">
              ›
            </button>
          </div>
        </div>

        <div className="news-slider">
          <div className="news-track" style={{ transform: `translateX(-${activeNewsIndex * 100}%)` }}>
            {news.map((item) => (
              <article className="news-slide" key={item.title}>
                <div className="news-slide-content">
                  <div className="news-meta">
                    <span>{item.date}</span>
                    <span>{item.category}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="news-dots" aria-label="Выбор новости">
          {news.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={`news-dot ${activeNewsIndex === index ? "active" : ""}`}
              onClick={() => setActiveNewsIndex(index)}
              aria-label={`Открыть новость ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="reviews-section" aria-label="Отзывы пользователей">
        <h2>Отзывы пользователей</h2>
        {reviewsLoading && <p className="reviews-status">Загрузка отзывов...</p>}
        {!reviewsLoading && reviews.length === 0 && <p className="reviews-status">Пока нет отзывов. Будьте первым.</p>}
        {!reviewsLoading && reviews.length > 0 && (
          <div className="reviews-carousel">
            <div className="reviews-track">
              {reviewCards.map((review, index) => (
                <article className="review-card" key={`${review.id}-${index}`}>
                  <h3>{review.name}</h3>
                  <span>{review.car}</span>
                  <p>{review.text}</p>
                  {review.rating > 0 && <small>{"★".repeat(Math.min(review.rating, 5))}</small>}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

export default Tariff;
