import React, { useState } from 'react';
import './style.css';

function Tariff() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      imgSrc: '../img/solaris.png',
      title: 'Hyundai Solaris',
      description: 'Hyundai Solaris - Городской компактный седан, идеально подходящий для маневренного передвижения по загруженным улицам. Этот автомобиль отличается экономичностью, компактностью и простотой в управлении, что делает его превосходным выбором для поездок по городу.'
    },
    {
      imgSrc: '../img/octavia.png',
      title: 'Skoda Octavia',
      description: 'Skoda Octavia - Универсальный и вместительный автомобиль, сочетающий в себе комфорт, практичность и современные технологии. Просторный салон, плавная коробка передач и экономичный двигатель делают Octavia идеальным спутником для дальних поездок и путешествий.'
    },
    {
      imgSrc: '../img/gle.png',
      title: 'Mercedes-Benz GLE',
      description: 'Mercedes-Benz GLE - Премиальный внедорожник, воплощающий в себе роскошь, мощность и проходимость. Этот автомобиль оснащен передовыми системами безопасности и комфорта, а также обладает впечатляющими внедорожными характеристиками, что делает его превосходным выбором для активного отдыха и поездок по бездорожью.'
    }
  ];

  const moveSlide = (direction) => {
    setCurrentSlide((prevSlide) => {
      const nextSlide = prevSlide + direction;
      if (nextSlide < 0) return slides.length - 1;
      if (nextSlide >= slides.length) return 0;
      return nextSlide;
    });
  };

  return (
    <section id="tariff">
      <h2>Тарифы</h2>
      <div className="rate">
        <ul className="rates">
          <li className="active">Эконом</li>
          <li>Комфорт</li>
          <li>Бизнес</li>
        </ul>

        <div className="slider">
          <div className="slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {slides.map((slide, index) => (
              <div
                key={index}
                className="slide"
              >
                <img src={slide.imgSrc} alt={slide.title} />
                <h3>{slide.title}</h3>
                <p>{slide.description}</p>
              </div>
            ))}
          </div>

          <img
            className="prev btn-arrow"
            onClick={() => moveSlide(-1)}
            src="img/svg/prev.svg"
            alt="Prev"
          />
          <img
            className="next btn-arrow"
            onClick={() => moveSlide(1)}
            src="img/svg/next.svg"
            alt="Next"
          />
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <p>
            от <b>10 ₽</b>
          </p>
          <p>за 1 минуту до 60 минут аренды</p>
        </div>
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
    </section>
  );
}

export default Tariff;
