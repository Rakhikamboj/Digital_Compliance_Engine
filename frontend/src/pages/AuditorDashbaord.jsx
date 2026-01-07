import { useState, useEffect } from "react"
import { Briefcase, Eye, RefreshCw, ArrowLeft, BarChart3, ChevronDown, LogOut } from "lucide-react"
import WasteDataEntry from "../components/CalculateDiversion"

const API_URL = "http://localhost:5000"

const AuditorDashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [setError] = useState(null)
  const [showComplianceDashboard, setShowComplianceDashboard] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showWasteEntry, setShowWasteEntry] = useState(false)

  useEffect(() => {
    fetchMyProjects()
  }, [])

  const fetchMyProjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${API_URL}/api/auditor/my-projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const updateProjectStatus = async (status) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/api/auditor/projects/${selectedProject._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      setProjects(projects.map((p) => (p._id === selectedProject._id ? { ...p, status } : p)))
      setSelectedProject({ ...selectedProject, status })
    } catch (err) {
      console.error("Update status error:", err)
    }
  }

  const handleWasteEntryComplete = async (wasteEntries) => {
    if (wasteEntries.length > 0) {
      await updateProjectStatus("Completed")
      alert("Project completed successfully!")
    }
    setShowWasteEntry(false)
    setSelectedProject(null)
    fetchMyProjects()
  }

  const Header = () => (
    <div style={s.header}>
      <div style={s.logoContainer}>
        <div style={s.logoIcon}>
          <Briefcase size={24} />
        </div>
        <div>
          <div style={s.logoText}>ESG Waste Evaluation</div>
          <div style={s.logoSubtext}>Environmental Management System</div>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <button style={s.userButton} onClick={() => setShowUserDropdown(!showUserDropdown)}>
          <div style={s.avatar}>{user?.email?.charAt(0).toUpperCase() || "A"}</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#194d2a" }}>
              {user?.auditorName || user?.email?.split("@")[0] || "Auditor"}
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Auditor</div>
          </div>
          <ChevronDown size={18} style={{ color: "#6b7280", marginLeft: "8px" }} />
        </button>

        {showUserDropdown && (
          <div style={s.dropdown}>
            <button
              style={s.dropdownItem}
              onClick={() => {
                setShowComplianceDashboard(true)
                setShowUserDropdown(false)
                setSelectedProject(null)
                setShowWasteEntry(false)
              }}
            >
              <BarChart3 size={18} />
              <span>Compliance Dashboard</span>
            </button>
            <div style={s.dropdownDivider}></div>
            <button style={{ ...s.dropdownItem, color: "#dc2626" }} onClick={onLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const s = {
    container: {
      padding: "20px",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fefffa 0%, #f5f8ee 100%)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 32px",
      background: "#fff",
      borderRadius: "20px",
      boxShadow: "0 4px 24px rgba(25,77,42,0.1)",
      position: "relative",
      marginBottom: "20px",
    },
    logoContainer: { display: "flex", alignItems: "center", gap: "16px" },
    logoIcon: {
      width: "56px",
      height: "56px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #194d2a 0%, #0d3618 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      boxShadow: "0 4px 16px rgba(25,77,42,0.3)",
    },
    logoText: { fontSize: "20px", fontWeight: "700", color: "#194d2a", letterSpacing: "-0.5px" },
    logoSubtext: { fontSize: "13px", color: "#6b7280", fontWeight: "500", marginTop: "2px" },
    userButton: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "8px 16px 8px 8px",
      background: "#f5f8ee",
      border: "2px solid rgba(25,77,42,0.1)",
      borderRadius: "14px",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    avatar: {
      width: "44px",
      height: "44px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, #194d2a 0%, #0d3618 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontWeight: "700",
      color: "#fff",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      right: "0",
      marginTop: "8px",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(25,77,42,0.15)",
      border: "1px solid rgba(25,77,42,0.08)",
      minWidth: "240px",
      padding: "8px",
      zIndex: 1000,
    },
    dropdownItem: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      background: "transparent",
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "500",
      color: "#194d2a",
      cursor: "pointer",
      transition: "all 0.2s ease",
      textAlign: "left",
    },
    dropdownDivider: { height: "1px", background: "#f5f8ee", margin: "8px 0" },
    title: { fontSize: "32px", fontWeight: "700", color: "#194d2a", marginBottom: "6px" },
    subtitle: { fontSize: "15px", color: "#6b7280" },
    card: {
      background: "#fff",
      borderRadius: "20px",
      padding: "32px",
      marginBottom: "24px",
      boxShadow: "0 4px 24px rgba(25,77,42,0.1)",
      border: "1px solid rgba(25,77,42,0.06)",
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
    th: {
      textAlign: "left",
      padding: "20px 24px",
      fontSize: "13px",
      fontWeight: "700",
      color: "#fff",
      textTransform: "uppercase",
      background: "linear-gradient(135deg, #194d2a 0%, #0d3618 100%)",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "24px",
      fontSize: "15px",
      color: "#374151",
      borderBottom: "1px solid #f5f8ee",
      fontWeight: "500",
    },
    btn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      background: "linear-gradient(135deg, #194d2a 0%, #0d3618 100%)",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 20px",
      background: "#f5f8ee",
      color: "#194d2a",
      border: "2px solid #194d2a",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    badge: { padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "inline-block" },
    emptyState: {
      textAlign: "center",
      padding: "100px 32px",
      background: "#fff",
      borderRadius: "20px",
      border: "2px dashed rgba(25,77,42,0.15)",
    },
  }

  if (showComplianceDashboard) {
    return (
      <>
        <Header />
        <div style={s.container}>
          <p>Compliance Dashboard Coming Soon</p>
        </div>
      </>
    )
  }

  if (showWasteEntry && selectedProject) {
    return (
      <>
        <Header />
        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: "24px" }}>
            <button
              style={s.backBtn}
              onClick={() => {
                setShowWasteEntry(false)
                setSelectedProject(null)
                fetchMyProjects()
              }}
            >
              <ArrowLeft size={18} /> Back to Projects
            </button>
          </div>
          <WasteDataEntry onNext={handleWasteEntryComplete} projectInfo={selectedProject} />
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={s.container}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={s.title}>My Projects</h1>
          <p style={s.subtitle}>Manage and update your assigned audit projects</p>
        </div>

        {loading ? (
          <div style={s.emptyState}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f5f8ee",
                borderTopColor: "#194d2a",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            ></div>
            <p style={{ color: "#6b7280" }}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={s.emptyState}>
            <div
              style={{
                width: "120px",
                height: "120px",
                background: "linear-gradient(135deg, #ffffff 0%, #fefffa 100%)",
                borderRadius: "30px",
                margin: "0 auto 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(25,77,42,0.12)",
              }}
            >
              <Briefcase size={48} style={{ color: "#194d2a" }} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#194d2a", marginBottom: "12px" }}>
              No projects found
            </h3>
            <p style={{ fontSize: "16px", color: "#6b7280" }}>Assigned projects will appear here.</p>
          </div>
        ) : (
          <div style={s.card}>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Project Name</th>
                    <th style={s.th}>Client</th>
                    <th style={s.th}>Industry</th>
                    <th style={s.th}>Status</th>
                    <th style={{ ...s.th, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const statusColor =
                      p.status === "Completed"
                        ? { bg: "rgba(34,197,94,0.15)", color: "#16a34a" }
                        : p.status === "In Progress" || p.status === "Started" || p.status === "Draft"
                          ? { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" }
                          : { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" }

                    return (
                      <tr key={p._id} style={{ borderBottom: "1px solid #f5f8ee", transition: "all 0.3s ease" }}>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #194d2a 0%, #0d3618 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#fff",
                                boxShadow: "0 4px 12px rgba(25,77,42,0.25)",
                              }}
                            >
                              {p.projectName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: "600", color: "#194d2a" }}>{p.projectName}</span>
                          </div>
                        </td>
                        <td style={s.td}>{p.clientName}</td>
                        <td style={s.td}>{p.industry}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: statusColor.bg, color: statusColor.color }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: "center" }}>
                          <button
                            style={s.btn}
                            onClick={() => {
                              setSelectedProject(p)
                              setShowWasteEntry(true)
                            }}
                          >
                            {p.status === "Assigned" ? (
                              "Start"
                            ) : p.status === "In Progress" || p.status === "Started" || p.status === "Draft" ? (
                              <>
                                <RefreshCw size={16} /> Resume
                              </>
                            ) : (
                              <>
                                <Eye size={16} /> View
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </>
  )
}

export default AuditorDashboard
