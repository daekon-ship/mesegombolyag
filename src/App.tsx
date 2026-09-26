import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { HowStoriesHelp } from "./components/HowStoriesHelp";
import { Occasions } from "./components/Occasions";
import { About } from "./components/About";
import { Testimonials } from "./components/Testimonials";
import { Process } from "./components/Process";
import { Journal } from "./components/Journal";
import { ContactCTA } from "./components/ContactCTA";
import { Footer } from "./components/Footer";
import { AppProvider } from "./context/AppState";
import { InquiryPage } from "./pages/InquiryPage";
import { BookingPage } from "./pages/BookingPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { ManagePage } from "./pages/ManagePage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminBookingsPage } from "./pages/admin/AdminBookingsPage";
import { AdminProgramEditPage, AdminProgramsPage } from "./pages/admin/AdminProgramsPage";
import { AdminContentPage, AdminEmailsPage, AdminInquiriesPage } from "./pages/admin/AdminMiscPages";
import { ScrollToTop } from "./components/ScrollToTop";
import { LegalPage } from "./pages/LegalPage";
import { PreviewBanner } from "./components/PreviewBanner";

/**
 * A főoldal vizuális ritmusa:
 * hero → meseterápia bevezető (szöveg + mandala) → témák →
 * külön kiemelt idézet → három alkalomtípus → rólam →
 * alkalom menete → gondolatok/Instagram → érdeklődés → lábléc
 */
function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Header />
      <main>
        <Hero />
        <Intro />
        <HowStoriesHelp />
        <Testimonials />
        <Occasions />
        <About />
        <Process />
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
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/erdeklodes" element={<InquiryPage />} />
          <Route path="/foglalas" element={<BookingPage />} />
          <Route path="/esemenyek" element={<EventsPage />} />
          <Route path="/esemenyek/:slug" element={<EventDetailPage />} />
          <Route path="/lemondas/:token" element={<ManagePage />} />
          <Route path="/adatkezeles" element={<LegalPage kind="privacy" />} />
          <Route path="/impresszum" element={<LegalPage kind="impressum" />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="attekintes" element={<AdminOverviewPage />} />
            <Route path="foglalasok" element={<AdminBookingsPage />} />
            <Route path="programok" element={<AdminProgramsPage />} />
            <Route path="programok/uj" element={<AdminProgramEditPage key="uj" />} />
            <Route path="programok/:id" element={<AdminProgramEditPage />} />
            <Route path="erdeklodesek" element={<AdminInquiriesPage />} />
            <Route path="tartalom" element={<AdminContentPage />} />
            <Route path="levelek" element={<AdminEmailsPage />} />
            <Route path="dashboard" element={<Navigate to="/admin/attekintes" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* a tartalom után, hogy az oldal alján tapadjon, és ne takarja a rögzített fejléc */}
        <PreviewBanner />
      </HashRouter>
    </AppProvider>
  );
}
