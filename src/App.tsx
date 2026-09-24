import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { HowStoriesHelp } from "./components/HowStoriesHelp";
import { Occasions } from "./components/Occasions";
import { About } from "./components/About";
import { Process } from "./components/Process";
import { Testimonials } from "./components/Testimonials";
import { Journal } from "./components/Journal";
import { ContactCTA } from "./components/ContactCTA";
import { Footer } from "./components/Footer";
import { AppProvider } from "./context/AppState";
import { BookingPage } from "./pages/BookingPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminBookingsPage } from "./pages/AdminBookingsPage";

function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Header />
      <main>
        <Hero />
        <Intro />
        <HowStoriesHelp />
        <Occasions />
        <About />
        <Process />
        <Testimonials />
        <Journal />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/foglalas" element={<BookingPage />} />
          <Route path="/esemenyek" element={<EventsPage />} />
          <Route path="/esemenyek/:slug" element={<EventDetailPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/foglalasok" element={<AdminBookingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
