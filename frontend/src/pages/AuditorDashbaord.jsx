"use client"

import { useState, useEffect } from "react"
import Header from "../components/Header"
import WasteDataEntry from "../components/CalculateDiversion"
import { Briefcase } from "lucide-react"
import styles from "../styles/Dashboard.module.css"

const API_URL = import.meta.env.VITE_API_KEY 
const AuditorDashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyProjects()
  }, [])

  const fetchMyProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auditor/my-projects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      const data = await response.json()
      console.log("Fetched auditor projects:", data)
      if (response.ok) {
        setProjects(data)
      } else {
        console.error("Error response:", data)
      }
    } catch (error) {
      console.error("Fetch projects error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartProject = async (project) => {
    try {
      if (project.status === "Assigned") {
        const response = await fetch(`${API_URL}/api/auditor/projects/${project._id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: "Started" }),
        })

        if (response.ok) {
          console.log("Project status updated to Started")
          // Update local state
          project.status = "Started"
        }
      }
      setSelectedProject(project)
    } catch (error) {
      console.error("Error starting project:", error)
    }
  }

  if (selectedProject) {
    return (
      <WasteDataEntry
        user={user}
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null)
          fetchMyProjects()
        }}
        onLogout={onLogout}
      />
    )
  }

  return (
    <div className={styles.auditorLayout}>
      <Header user={user} onLogout={onLogout} />
      <main className={styles.auditorContent}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>My Projects</h1>
          <p className={styles.welcomeSubtitle}>Manage and update your assigned audit projects</p>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.emptyState}>Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className={styles.emptyStateWide}>
              <Briefcase size={48} />
              <h3>No projects found</h3>
              <p>Assigned projects will appear here.</p>
            </div>
          ) : (
            <table className={styles.projectTable}>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td>{project.projectName}</td>
                    <td>{project.clientName}</td>
                    <td>{project.industry}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${project.status.replace(" ", "")}`]}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles.startBtn} onClick={() => handleStartProject(project)}>
                        {project.status === "Assigned"
                          ? "Start"
                          : project.status === "Started" || project.status === "Draft"
                            ? "Resume"
                            : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

export default AuditorDashboard
