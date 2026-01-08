import { useState, useEffect } from "react"
import { Briefcase, Eye, RefreshCw, ArrowLeft, BarChart3, ChevronDown, LogOut } from "lucide-react"
import WasteDataEntry from "../components/CalculateDiversion"
import Pagination from "../common/Pagination"
import styles from "../styles/AuditorDashboard.module.css"

const API_URL = import.meta.env.VITE_API_KEY

const AuditorDashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [setError] = useState(null)
  const [showComplianceDashboard, setShowComplianceDashboard] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showWasteEntry, setShowWasteEntry] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  // Pagination calculations
  const totalPages = Math.ceil(projects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProjects = projects.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const Header = () => (
    <div className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Briefcase size={24} />
        </div>
        <div>
          <div className={styles.logoText}>ESG Waste Evaluation</div>
          <div className={styles.logoSubtext}>Environmental Management System</div>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <button className={styles.userButton} onClick={() => setShowUserDropdown(!showUserDropdown)}>
          <div className={styles.avatar}>{user?.email?.charAt(0).toUpperCase() || "A"}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {user?.auditorName || user?.email?.split("@")[0] || "Auditor"}
            </div>
            <div className={styles.userRole}>Auditor</div>
          </div>
          <ChevronDown size={18} style={{ color: "#6b7280", marginLeft: "8px" }} />
        </button>

        {showUserDropdown && (
          <div className={styles.dropdown}>
            <button
              className={styles.dropdownItem}
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
            <div className={styles.dropdownDivider}></div>
            <button 
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={onLogout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const getStatusColor = (status) => {
    if (status === "Completed") {
      return { bg: "rgba(34,197,94,0.15)", color: "#16a34a" }
    }
    if (status === "In Progress" || status === "Started" || status === "In-Progress") {
      return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" }
    }
    return { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" }
  }

  if (showComplianceDashboard) {
    return (
      <>
        <Header />
        <div className={styles.container}>
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
              className={styles.backBtn}
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
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>My Projects</h1>
          <p className={styles.subtitle}>Manage and update your assigned audit projects</p>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Briefcase size={48} style={{ color: "#194d2a" }} />
            </div>
            <h3 className={styles.emptyStateTitle}>No projects found</h3>
            <p className={styles.emptyStateText}>Assigned projects will appear here.</p>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Project Name</th>
                    <th className={styles.th}>Client</th>
                    <th className={styles.th}>Industry</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.thCenter}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProjects.map((p) => {
                    const statusColor = getStatusColor(p.status)

                    return (
                      <tr key={p._id} className={styles.tr}>
                        <td className={styles.td}>
                          <div className={styles.projectCell}>
                            <div className={styles.projectIcon}>
                              {p.projectName.charAt(0).toUpperCase()}
                            </div>
                            <span className={styles.projectName}>{p.projectName}</span>
                          </div>
                        </td>
                        <td className={styles.td}>{p.clientName}</td>
                        <td className={styles.td}>{p.industry}</td>
                        <td className={styles.td}>
                          <span 
                            className={styles.badge}
                            style={{ background: statusColor.bg, color: statusColor.color }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className={styles.tdCenter}>
                          <button
                            className={styles.btn}
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={projects.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default AuditorDashboard