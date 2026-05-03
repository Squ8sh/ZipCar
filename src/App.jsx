import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import InfoSection from './components/InfoSection';
import OurSection from './components/Our';
import Rules from './components/Rules';
import Tariff from './components/Tariff';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

import SecondPage from './pages/SecondPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Profile from './pages/Profile';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Notifications from './pages/Notifications';
import AdminUsers from './pages/AdminUsers';
import AdminCars from './pages/AdminCars';
import AdminBookings from './pages/AdminBookings';
import AdminFinance from './pages/AdminFinance';

import './components/style.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <InfoSection />
              <OurSection />
              <Rules />
              <Tariff />
              <FAQ />
              <Footer />
            </>
          }
        />

        <Route path="/second" element={<SecondPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/cars" element={<AdminCars />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/finance" element={<AdminFinance />} />
      </Routes>
    </div>
  );
}

export default App;

