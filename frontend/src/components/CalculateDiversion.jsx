import { useState, useEffect } from "react";
import { Table, FileSpreadsheet } from "lucide-react";

import WasteDataEntryExcel from "./ExcelView";
import WasteDataEntryForm from "./FormView";
import WasteEntrySidebar from "./WasteEntrySidebar";
import ComplianceDashboard from "../pages/Dashboard";
import { ToastProvider } from "../context/ToastContext";
import { useToast } from "../context/ToastContext";
import styles from "../styles/WasteDataEntry.module.css"

const API_URL = import.meta.env.VITE_API_KEY;

const WasteEntryContainer = ({ projectInfo, onBackToProjects }) => {
  const [activeView, setActiveView] = useState("excel");
  const [wasteEntries, setWasteEntries] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [sidebarState, setSidebarState] = useState(1); // 0=collapsed, 1=normal, 2=expanded
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); // NEW: Dashboard state

  const { showToast } = useToast();

  const getAuthToken = () => localStorage.getItem("token");
  
  const getUserIdFromToken = () => {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Fetch waste entries - lifted to parent component
  const fetchWasteEntries = async () => {
    try {
      setFetchLoading(true);
      const token = getAuthToken();
      const userId = getUserIdFromToken();
      const projectId = projectInfo?._id;

      if (!token || !userId) {
        showToast("Please log in to view waste entries", "error");
        return;
      }

      const params = new URLSearchParams();
      params.append("userId", userId);
      if (projectId) params.append("projectId", projectId);

      const response = await fetch(
        `${API_URL}/api/waste-entries?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = await response.json();
      if (response.ok) {
        setWasteEntries(result.data || []);
        console.log("✅ Fetched entries:", result.data?.length || 0);
      } else {
        showToast(result.message || "Failed to fetch entries", "error");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Failed to fetch waste entries", "error");
    } finally {
      setFetchLoading(false);
    }
  };

  // Fetch entries when component mounts or projectInfo changes
  useEffect(() => {
    if (projectInfo?._id) {
      fetchWasteEntries();
    }
  }, [projectInfo?._id]);

  const handleDeleteEntry = async (id) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}/api/waste-entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setWasteEntries((prev) => prev.filter((e) => e._id !== id));
        showToast("Entry deleted successfully", "success");
      }
    } catch {
      showToast("Failed to delete entry", "error");
    }
  };

  const handleSubmitEntries = () => {
    showToast("All entries submitted successfully", "success");
  };

  // Get content wrapper class based on sidebar state
  const getContentWrapperClass = () => {
    switch (sidebarState) {
      case 0:
        return styles.contentWrapperCollapsed;
      case 1:
        return styles.contentWrapperNormal;
      case 2:
        return styles.contentWrapperExpanded;
      default:
        return styles.contentWrapperNormal;
    }
  };

  // NEW: If dashboard is shown, render only the dashboard
  if (showDashboard) {
    return (
      <ToastProvider>
        <ComplianceDashboard
          projectSelected={projectInfo}
          reportingPeriod={projectInfo?.reportingPeriod}
          onBack={() => setShowDashboard(false)}
        />
      </ToastProvider>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <WasteEntrySidebar
        projectInfo={projectInfo}
        wasteEntries={wasteEntries}
        fetchLoading={fetchLoading}
        onBackToProjects={onBackToProjects}
        onDeleteEntry={handleDeleteEntry}
        onSubmitEntries={handleSubmitEntries}
        onSidebarStateChange={setSidebarState}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(prev => !prev)}
        onShowDashboard={() => setShowDashboard(true)} // NEW: Pass callback
      />

      <div
        className={`${styles.contentWrapper} ${getContentWrapperClass()}`}
        style={{
          flex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "0px",
          transition: "margin-left 0.25s ease, width 0.25s ease",
        }}
      >
        {/* Header */}
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: "3rem 0",
          }}
        >
          {activeView === "excel" ? "Spreadsheet View" : "Form Entry View"}
        </p>

        {/* Toggle */}
        <div
          style={{
            display: "flex",
            background: "#f3f4f6",
            borderRadius: "20px",
            height: "40px",
            padding: "4px",
            gap: "2px",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "fit-content",
            marginLeft: "auto",
            marginRight: "1rem",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={() => setActiveView("excel")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "10px 10px",
              background: activeView === "excel" ? "#194d2a" : "transparent",
              color: activeView === "excel" ? "#c4c4c4" : "#1b1b1b",
              width: activeView === "excel" ? "80px" : "40px",
              border: "none",
              borderRadius: "42px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FileSpreadsheet size={18} />
           
          </button>

          <button
            onClick={() => setActiveView("form")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 10px",
              background: activeView === "form" ? "#194d2a" : "transparent",
              color: activeView === "form" ? "#fff" : "#6b7280",
              width: activeView === "form" ? "80px" : "40px",
              border: "none",
              borderRadius: "42px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Table size={18} />
            
          </button>
        </div>

        {/* Content */}
        <main style={{ flex: 1 }}>
          {activeView === "excel" ? (
            <WasteDataEntryExcel
              projectInfo={projectInfo}
              onBackToProjects={onBackToProjects}
              wasteEntries={wasteEntries}
              setWasteEntries={setWasteEntries}
              fetchLoading={fetchLoading}
              refreshEntries={fetchWasteEntries}
            />
          ) : (
            <WasteDataEntryForm
              projectInfo={projectInfo}
              onNext={onBackToProjects}
              wasteEntries={wasteEntries}
              setWasteEntries={setWasteEntries}
              refreshEntries={fetchWasteEntries}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default WasteEntryContainer;