import { useState, useEffect } from "react"
import { FolderPlus, Search, Filter, Briefcase, CheckCircle, Clock, AlertCircle,  } from "lucide-react"
import styles from "../styles/Dashboard.module.css"
const API_URL = import.meta.env.VITE_API_KEY 
const ProjectManagement = () => {
  const [projects, setProjects] = useState([])
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    projectName: "",
    projectDescription: "",
    clientName: "",
    clientEmail: "",
    clientNumber: "",
    companyName: "",
    industry: "",
    reportingPeriod: "Calendar Year 2024",
    assignedAuditor: "",
  })

  useEffect(() => {
    fetchProjects()
    fetchAuditors()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/projects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      const data = await response.json()
      if (response.ok) setProjects(data)
    } catch (error) {
      console.error("Fetch projects error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/auditors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      const data = await response.json()
      if (response.ok) setAuditors(data)
    } catch (error) {
      console.error("Fetch auditors error:", error)
    }
  }

const handleCreateProject = async () => {
  try {
    const payload = { ...formData }

    // ✅ REMOVE empty assignedAuditor
    if (!payload.assignedAuditor) {
      delete payload.assignedAuditor
    }

    const response = await fetch(`${API_URL}/api/admin/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      setIsModalOpen(false)
      setStep(1)
      fetchProjects()
      setFormData({
        projectName: "",
        projectDescription: "",
        clientName: "",
        clientEmail: "",
        clientNumber: "",
        companyName: "",
        industry: "",
        reportingPeriod: "Calendar Year 2024",
        assignedAuditor: "",
      })
    } else {
      const data = await response.json()
      alert(data.message)
    }
  } catch (error) {
    console.error("Create project error:", error)
  }
}


  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={16} className={styles.statusCompleted} />
      case "In Progress":
        return <Clock size={16} className={styles.statusProgress} />
      case "Not Started":
        return <AlertCircle size={16} className={styles.statusStarted} />
      default:
        return <AlertCircle size={16} className={styles.statusAssigned} />
    }
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Project Management</h2>
          <p className={styles.sectionSubtitle}>Monitor and manage all compliance projects</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
          <FolderPlus size={18} />
          <span>Create Project</span>
        </button>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input type="text" placeholder="Search projects..." />
        </div>
        <div className={styles.filtersAction}>
          <button className={styles.filterBtn}>
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Briefcase size={48} />
          </div>
          <h3>No projects created yet</h3>
          <p>Get started by creating your first compliance project.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client Name</th>
                <th>Auditor Assigned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project._id}>
                  <td>
                    <span className={styles.boldText}>{project.projectName}</span>
                  </td>
                  <td>{project.clientName}</td>
                <td>
  {project.assignedAuditor?.email ? (
    <div className={styles.assignedUser}>
      <div className={styles.avatarMini}>
        {/* {project.assignedAuditor.auditorName.toUpperCase()} */}
      </div>
      <span>
        {project.assignedAuditor.email}
      </span>
    </div>
  ) : (
    <span className={styles.unassigned}>Unassigned</span>
  )}
</td>


                  <td>
                    <div className={styles.statusCell}>
                      {getStatusIcon(project.status)}
                      <span className={styles.statusText}>{project.status}</span>
                    </div>
                  </td>
                  <td>
                    <button className={styles.textLink}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentStepper}>
            <div className={styles.stepperHeader}>
              <div className={styles.stepperProgress}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`${styles.step} ${step >= s ? styles.stepActive : ""} ${step === s ? styles.stepCurrent : ""}`}
                  >
                    {s}
                  </div>
                ))}
              </div>
              <h3 className={styles.modalTitle}>
                {step === 1 && "Project Information"}
                {step === 2 && "Client Details"}
                {step === 3 && "Assign Auditor"}
              </h3>
            </div>

            <div className={styles.stepperBody}>
              {step === 1 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Project Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Annual Waste Compliance 2024"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Industry Type</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    >
                      <option value="">Select Industry</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Banking">Banking</option>
                      <option value="Manufacturing">Manufacturing</option>
                    </select>
                  </div>
                  <div className={styles.formGroupFull}>
                    <label>Project Description</label>
                    <textarea
                      rows={3}
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Client Name</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Client Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      value={formData.clientNumber}
                      onChange={(e) => setFormData({ ...formData, clientNumber: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label>Select Auditor</label>
                    <select
                      className={styles.largeSelect}
                      value={formData.assignedAuditor}
                      onChange={(e) => setFormData({ ...formData, assignedAuditor: e.target.value })}
                    >
                      <option value="">Choose an Auditor</option>
                      {auditors.map((auditor) => (
                        <option key={auditor._id} value={auditor._id}>
                          {auditor.email.split("@")[0]} ({auditor.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroupFull}>
                    <label>Reporting Period</label>
                    <input
                      type="text"
                      value={formData.reportingPeriod}
                      onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.stepperFooter}>
              {step > 1 ? (
                <button className={styles.secondaryBtn} onClick={() => setStep(step - 1)}>
                  Back
                </button>
              ) : (
                <button className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button className={styles.primaryBtn} onClick={() => setStep(step + 1)}>
                  Next Step
                </button>
              ) : (
                <button className={styles.primaryBtn} onClick={handleCreateProject}>
                  Finalize & Create
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectManagement
