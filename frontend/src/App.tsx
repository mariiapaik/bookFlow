import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { auth } from './api';
import BookingPage from './pages/BookingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  if (!auth.token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="min-h-full">
      <header className="border-b border-brand-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-brand-600">
            ✦ BookFlow
          </Link>
          <nav className="text-sm">
            <Link to="/admin" className="text-gray-500 hover:text-brand-600">
              Staff login
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth>
                <AdminDashboardPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
