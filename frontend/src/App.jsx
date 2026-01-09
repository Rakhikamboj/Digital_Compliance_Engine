import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuditorDashboard from "./pages/AuditorDashbaord";

const API_URL = import.meta.env.VITE_API_KEY;

const App = () => {
  const navigate = useNavigate(); // ✅ REQUIRED
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
          setUser(null);
          navigate("/login", { replace: true }); // ✅ WORKS
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
    navigate("/", { replace: true }); // ✅ redirect after login
  };

  const handleLogout = () => {
    console.log("LOGOUT CLICKED"); // debug proof
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true }); // ✅ THIS FIXES EVERYTHING
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* LOGIN ROUTE (PUBLIC) */}
      <Route path="/login" element={<Auth onLogin={handleLogin} />} />

      {/* PROTECTED ROOT */}
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

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
