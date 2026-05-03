import './style.css';

function Our() {
  const advantages = [
    {
      title: 'Быстрое бронирование',
      text: 'Выберите ближайший автомобиль, оформите аренду онлайн и начните поездку без долгого ожидания.'
    },
    {
      title: 'Автомобили под разные задачи',
      text: 'В сервисе доступны машины для обычных поездок, деловых встреч, семейных маршрутов и особых случаев.'
    },
    {
      title: 'Контроль состояния авто',
      text: 'Мы следим за техническим состоянием автомобилей, чистотой салона и готовностью машины к поездке.'
    }
  ];

  const cities = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Сочи', 'Самара', 'Уфа', 'Тула'];

  return (
    <section id="Our" className="about-section">
      <h2>О нас</h2>

      <div className="about-hero">
        <div className="about-content">
          <span className="section-kicker">ZipCar</span>
          <h3>Каршеринг для удобных поездок каждый день</h3>
          <p>
            ZipCar помогает быстро найти автомобиль рядом с вами и арендовать его под нужную задачу: поездку на работу,
            встречу, прогулку по городу или выезд за его пределы. Мы сделали сервис простым, понятным и доступным для
            водителей с разным опытом.
          </p>
          <p>
            В автопарке представлены машины разных классов — от экономичных городских моделей до комфортных автомобилей
            бизнес- и премиум-класса.
          </p>

          <div className="about-actions">
            <a href="#tariff" className="about-button about-button-primary">Выбрать класс авто</a>
            <a href="#rules" className="about-button about-button-secondary">Посмотреть правила</a>
          </div>
        </div>

        <div className="about-stats" aria-label="Преимущества сервиса ZipCar">
          <div className="about-stat-card">
            <b>12+</b>
            <span>городов присутствия</span>
          </div>
          <div className="about-stat-card">
            <b>200+</b>
            <span>автомобилей в каждом городе</span>
          </div>
          <div className="about-stat-card">
            <b>24/7</b>
            <span>доступ к аренде</span>
          </div>
        </div>
      </div>

      <div className="about-grid">
        {advantages.map((advantage, index) => (
          <article className="about-card" key={advantage.title}>
            <span className="about-card-number">0{index + 1}</span>
            <h3>{advantage.title}</h3>
            <p>{advantage.text}</p>
          </article>
        ))}
      </div>

      <div className="about-cities">
        <div>
          <span className="section-kicker">География</span>
          <h3>Автомобили доступны в крупных городах</h3>
        </div>
        <div className="city-tags">
          {cities.map((city) => (
            <span className="city-tag" key={city}>{city}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Our;
