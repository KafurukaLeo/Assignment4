import { lazy, Suspense, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Spinner from "./components/Spinner";
import DashboardListing from "./pages/host/Listing";
import { ProtectedRoute } from "./lib/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import Listing from "./pages/Listing";
import Footer from "./components/layout/Footer";
import DashboardBooking from "./pages/host/Booking";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import BookingCalendar from "./pages/BookingCalendar";
import Reviews from "./pages/Reviews";
import Bookings from "./pages/Bookings";
import BookingForm from "./pages/BookingForm";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import { useAuthStore } from "./store/auth.store";
import HostApprovals from "./pages/admin/HostApprovals";
import UserManagement from "./pages/admin/UserManagement";
import BecomeHost from "./pages/BecomeHost";


const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Dashboard = lazy(() => import("./pages/host/Dashboard"));

const PUBLIC_ROUTES = ["/", "/all-listings", "/profile", "/favorites"];

export default function App() {
  const location = useLocation();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isDashboard =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin");
  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-otp",
    "/reset-password",
    "/test",
  ].includes(location.pathname);
  const isPublic =
    PUBLIC_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith("/listings/") ||
    location.pathname.startsWith("/bookings/") ||
    location.pathname.startsWith("/messages");

  const showNavbar = isPublic;
  const showFooter = isPublic;

  return (
    <div className="flex flex-col min-h-screen">
      {!isDashboard && !isAuthPage && <Navbar />}
      <main
        className={`grow ${showNavbar ? "lg:pt-3 px-4 md:px-[6vw] lg:px-[9vw]" : ""}`}
      >
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/all-listings" element={<Listing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<BookingForm />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route
              path="/bookings/:id/calendar"
              element={<BookingCalendar />}
            />
            <Route path="/listings/:id/reviews" element={<Reviews />} />
            <Route path="/become-a-host" element={<BecomeHost />} />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="host">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="bookings" element={<DashboardBooking />} />
              <Route path="listings" element={<DashboardListing />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:id" element={<Messages />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="approvals" element={<HostApprovals />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
