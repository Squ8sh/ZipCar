import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { me, logout } from '../api/auth';
import './style.css';

function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

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

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const currentUser = await me();
        if (mounted) setUser(currentUser ?? null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  }

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
                <a href="#news" className="anchor-link">Новости</a>
              </li>
              <li className="site-navigation-item">
                <a href="#FAQ" className="anchor-link">Помощь</a>
              </li>

              {user?.is_admin && (
                <li className="site-navigation-item">
                  <Link to="/admin" className="anchor-link admin-nav-link">
                    Админ панель
                  </Link>
                </li>
              )}

            </ul>
          </nav>

          <div className="header-controls">
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

            <div className="auth-actions">
              {!loadingUser && (
                user ? (
                  <>
                    <Link to="/profile" className="theme-button theme-button-light auth-link">
                      Профиль
                    </Link>
                    <button
                      type="button"
                      className="theme-button theme-button-dark auth-link"
                      onClick={handleLogout}
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="theme-button theme-button-light auth-link">
                      Вход
                    </Link>
                    <Link to="/register" className="theme-button theme-button-dark auth-link">
                      Регистрация
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;