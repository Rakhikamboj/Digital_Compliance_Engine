import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuditorDashboard from "./pages/AuditorDashbaord";
import ComplianceDashboard from "./pages/Dashboard";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import Toast from "./common/Toast";

import WasteEntryContainer from "./components/CalculateDiversion";

const API_URL = import.meta.env.VITE_API_KEY;

const AppContent = () => {
  const navigate = useNavigate();
  const { toast, closeToast } = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data);
        } else {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Auth verify error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate("/", { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Auth onLogin={handleLogin} />} />

        {/* ROOT DASHBOARD */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "ADMIN" ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : user.role === "AUDITOR" ? (
                <AuditorDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Dashboard user={user} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* WASTE ENTRY (AUDITOR ONLY) */}
        <Route
          path="/waste-entry"
          element={
            user?.role === "AUDITOR" ? (
              <WasteEntryContainer user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* COMPLIANCE DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <ComplianceDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;