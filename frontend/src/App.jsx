import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Auth from "./pages/Auth";
import Header from "./components/Header";
import NavigationTabs from "./components/NavigationTabs";
import ReportingPeriod from "./components/ReportingPeriod";
import WasteDataEntry from "./components/CalculateDiversion";
import ComplianceDashboard from "./pages/Dashboard";

// Create a wrapper component to use useNavigate
function AppContent({ currentUser, handleLogout }) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState("period");

  const [reportingPeriod, setReportingPeriod] = useState({
    periodType: "financial",
    year: "2024-25",
  });

  const [wasteEntries, setWasteEntries] = useState([]);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <Routes>
        {/* Compliance Flow (STATE BASED) */}
        <Route
          path="/"
          element={
            <>
              <NavigationTabs
                activeStep={activeStep}
                setActiveStep={setActiveStep}
              />

              {activeStep === "period" && (
                <ReportingPeriod
                  reportingPeriod={reportingPeriod}
                  setReportingPeriod={setReportingPeriod}
                  onNext={() => setActiveStep("data-entry")}
                />
              )}

              {activeStep === "data-entry" && (
                <WasteDataEntry
                  wasteEntries={wasteEntries}
                  onAddEntry={(e) =>
                    setWasteEntries([...wasteEntries, e])
                  }
                  onDeleteEntry={(id) =>
                    setWasteEntries(
                      wasteEntries.filter((e) => e.id !== id)
                    )
                  }
                  onNext={() => navigate("/dashboard")}
                />
              )}
            </>
          }
        />

        {/* DASHBOARD (ROUTE BASED) */}
        <Route
          path="/dashboard"
          element={
            <ComplianceDashboard
              wasteEntries={wasteEntries}
              reportingPeriod={reportingPeriod}
            />
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <AppContent 
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        handleLogout={handleLogout}
      />
    </BrowserRouter>
  );
}

export default App;