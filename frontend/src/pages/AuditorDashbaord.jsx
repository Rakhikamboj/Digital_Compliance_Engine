import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase, Eye, RefreshCw } from "lucide-react"
import WasteDataEntry from "../components/CalculateDiversion"
import Pagination from "../common/Pagination"
import styles from "../styles/AuditorDashboard.module.css"
import AuditorHeader from "../components/AuditorHeader"
import { useToast } from "../context/ToastContext";

const API_URL = import.meta.env.VITE_API_KEY

const AuditorDashboard = (user, onLogout) => {
  const [projects, setProjects] = useState([])
  const { showToast } = useToast();
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)

 
  const [showWasteEntry, setShowWasteEntry] = useState(false)
  const navigate= useNavigate() 
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchMyProjects()
  }, [])
const handleLogout = () => {
  localStorage.removeItem("token");


  navigate("/login", { replace: true });
}

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
      showToast("Failed to load projects", "error")
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
      showToast("Project completed successfully!", "success")
    }
    setShowWasteEntry(false)
    setSelectedProject(null)
    fetchMyProjects()
  }

  const totalPages = Math.ceil(projects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProjects = projects.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const getStatusColor = (status) => {
    if (status === "Completed") {
      return { bg: "rgba(34,197,94,0.15)", color: "#16a34a" }
    }
    if (status === "In Progress" || status === "In-Progress") {
      return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" }
    }
    return { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" }
  }

  if (showWasteEntry && selectedProject) {
    return (
      <>
        <AuditorHeader user={user} onLogout={onLogout}/>
        <WasteDataEntry
          onNext={handleWasteEntryComplete}
          projectInfo={selectedProject}
          onBackToProjects={() => {
            setShowWasteEntry(false)
            setSelectedProject(null)
            fetchMyProjects()
          }}
        />
      </>
    )
  }

  return (
    <>
       <AuditorHeader user={user} onLogout={handleLogout}/>
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
                            <div className={styles.projectIcon}>{p.projectName.charAt(0).toUpperCase()}</div>
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
                            {p.status == "Assigned" ? "Not Started" : p.status}
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
                            ) : p.status === "In Progress" ? (
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
