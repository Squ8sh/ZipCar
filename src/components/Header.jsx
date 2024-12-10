import React, { useState } from 'react';
import './style.css';

function Header() {
  // Состояние для светлой/темной темы
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Функция для переключения темы
  const toggleTheme = (theme) => {
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      setIsDarkMode(false);
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  };

  return (
    <header>
      <div className="header-container">
        <img src="./img/svg/Logo.svg" alt="Логотип ZipCar" />
        <div className="header-right">
          <nav className="nav-list">
            <ul className="site-navigation">
              <li className="site-navigation-item">
                <a href="#Our" className="anchor-link">О нас</a>
              </li>
              <li className="site-navigation-item">
                <a href="#rules" className="anchor-link">Правила</a>
              </li>
              <li className="site-navigation-item">
                <a href="#tariff" className="anchor-link">Тарифы</a>
              </li>
              <li className="site-navigation-item">
                <a href="#FAQ" className="anchor-link">Помощь</a>
              </li>
              <li className="site-navigation-item">
                +7 (999) 162-79-25
              </li>
            </ul>
          </nav>
          <ul className="themes">
            <li>
              <button
                className={`theme-button ${!isDarkMode ? 'active' : ''} theme-button-light`}
                type="button"
                onClick={() => toggleTheme('light')}
              >
                Светлая
              </button>
            </li>
            <li>
              <button
                className={`theme-button ${isDarkMode ? 'active' : ''} theme-button-dark`}
                type="button"
                onClick={() => toggleTheme('dark')}
              >
                Темная
              </button>
            </li>
          </ul>
        </div>
      </div>
      
    </header>
  );
}

export default Header;
