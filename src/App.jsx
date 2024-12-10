import { useState } from 'react';
import Header from './components/Header';
import InfoSection from './components/InfoSection';
import OurSection from './components/Our';
import Rules from './components/Rules';
import Tariff from './components/Tariff';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import './components/style.css'
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Header />
      <InfoSection />
      <div class="btn-up btn-up_hide">
      </div>
      <OurSection />
      <Rules />
      <Tariff />
      <FAQ />
      <Footer />
    </div>
  );
}

export default App;
