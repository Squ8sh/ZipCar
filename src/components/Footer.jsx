import './style.css';

function Footer() {
    return (
        <footer>
            <div className="logo">
                <img src="../img/svg/Logo.svg" alt="" className='log'></img>
                <p>115054, Москва,
                    Большая Пионерская улица, 28</p>
            </div>
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
            </ul>
            <ul className="socials">
                <li>
                    <img src="img/svg/vk.svg" alt=""></img>
                </li>
                <li>
                    <img src="img/svg/telegram.svg" alt=""></img>
                </li>
                <li>
                    <img src="img/svg/youtube.svg" alt=""></img>
                </li>
            </ul>
        </footer>
    );
}

export default Footer;
