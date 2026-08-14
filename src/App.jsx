import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Movies from './pages/Movies';
import BookNow from './pages/BookNow';
import MovieDetails from './pages/MovieDetails';
import SelectSeats from './pages/SelectSeats';
import MyBookings from './pages/Mybookings';
import Events from './pages/Events';
import Login from './pages/Login';
import TicketVerification from './pages/TicketVerification';
import EditProfile from './pages/EditProfile';
import Payment from './pages/Payment';
import AIChatbox from './components/AIChatbox';
import ToastContainer from './components/Toast';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/book" element={<BookNow />} />
        <Route path="/seats" element={<SelectSeats />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/events" element={<Events />} />
        <Route path="/login" element={<Login />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/ticket/:bookingCode" element={<TicketVerification />} />
      </Routes>
      <AIChatbox />
    </BrowserRouter>
  );
}

export default App;