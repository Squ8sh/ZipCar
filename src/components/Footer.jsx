import './style.css';

function Footer() {
    return (
        <footer>
            <div class="logo">
                <img src="../img/svg/Logo.svg" alt="" className='log'></img>
                <p>115054, Москва,
                    Большая Пионерская улица, 28</p>
            </div>
            <ul class="site-navigation">
                <li class="site-navigation-item">
                    <a href="#our" class="anchor-link">О нас</a>
                </li>
                <li class="site-navigation-item">
                    <a href="#rules" class="anchor-link">Правила</a>
                </li>
                <li class="site-navigation-item">
                    <a href="#tariff" class="anchor-link">Тарифы</a>
                </li>
                <li class="site-navigation-item">
                    <a href="#FAQ" class="anchor-link">Помощь</a>
                </li>
            </ul>
            <ul class="socials">
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
