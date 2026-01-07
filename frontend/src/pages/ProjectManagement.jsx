import { useState, useEffect } from "react"
import { FolderPlus, Calendar } from "lucide-react"
import { CheckCircle, Clock, AlertCircle, Briefcase, XCircle } from "lucide-react"
import styles from "../styles/ProjectManagement.module.css"
import Pagination from "../common/Pagination"
import SearchBar from "../common/Searchbar"

const API_URL = import.meta.env.VITE_API_KEY

const ProjectManagement = () => {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [auditorFilter, setAuditorFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const [formData, setFormData] = useState({
    projectName: "",
    projectDescription: "",
    clientName: "",
    clientEmail: "",
    clientNumber: "",
    companyName: "",
    industry: "",
    reportingPeriod: {
      periodType: "financial",
      year: "2024-25"
    },
    assignedAuditor: "",
  })

  useEffect(() => {
    fetchProjects()
    fetchAuditors()
  }, [])

  useEffect(() => {
    applyFilters()
    setCurrentPage(1) // Reset to first page when filters change
  }, [projects, searchQuery, statusFilter, auditorFilter, sortBy])

  const applyFilters = () => {
    let filtered = [...projects]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(p =>
        p.projectName?.toLowerCase().includes(query) ||
        p.clientName?.toLowerCase().includes(query) ||
        p.companyName?.toLowerCase().includes(query) ||
        p.industry?.toLowerCase().includes(query) ||
        p.assignedAuditor?.email?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (auditorFilter !== "all") {
      if (auditorFilter === "unassigned") {
        filtered = filtered.filter(p => !p.assignedAuditor)
      } else {
        filtered = filtered.filter(p => p.assignedAuditor?._id === auditorFilter)
      }
    }

    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      } else if (sortBy === "name") {
        return (a.projectName || "").localeCompare(b.projectName || "")
      } else if (sortBy === "client") {
        return (a.clientName || "").localeCompare(b.clientName || "")
      }
      return 0
    })

    setFilteredProjects(filtered)
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token || token === "undefined" || token === "null") {
        console.error("ProjectManagement: No valid token available")
        setError("Authentication required. Please login again.")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/admin/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched projects:", data)
        setProjects(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("ProjectManagement: Fetch failed", response.status, errorData.message)
        setError(errorData.message || "Failed to fetch projects")
        if (response.status === 401) {
          localStorage.removeItem("token")
          setError("Session expired. Please login again.")
        }
      }
    } catch (error) {
      console.error("Fetch projects error:", error)
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditors = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${API_URL}/api/admin/auditors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAuditors(data)
      }
    } catch (error) {
      console.error("Fetch auditors error:", error)
    }
  }

  const handleCreateProject = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Authentication required. Please login again.")
        return
      }

      const payload = { ...formData }
      if (!payload.assignedAuditor) {
        delete payload.assignedAuditor
      }

      const response = await fetch(`${API_URL}/api/admin/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
          reportingPeriod: {
            periodType: "financial",
            year: "2024-25"
          },
          assignedAuditor: "",
        })
        alert("Project created successfully!")
      } else {
        const data = await response.json()
        alert(data.message || "Failed to create project")
      }
    } catch (error) {
      console.error("Create project error:", error)
      alert("Network error. Please try again.")
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={16} />
      case "In Progress":
      case "Started":
        return <Clock size={16} />
      case "Not Started":
      case "Assigned":
        return <AlertCircle size={16} />
      default:
        return <Briefcase size={16} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return { bg: 'rgba(34,197,94,0.15)', color: '#16a34a' }
      case "In Progress":
        return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
      case "Started":
        return { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' }
      case "Assigned":
        return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' }
      case "Not Started":
        return { bg: 'rgba(156,163,175,0.15)', color: '#6b7280' }
      default:
        return { bg: 'rgba(156,163,175,0.15)', color: '#6b7280' }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setAuditorFilter("all")
    setSortBy("newest")
  }

  const hasActiveFilters = () => {
    return searchQuery !== "" || statusFilter !== "all" || auditorFilter !== "all" || sortBy !== "newest"
  }

  const getFilteredCount = (status) => {
    return projects.filter(p => p.status === status).length
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProjects = filteredProjects.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Project Management</h1>
          <p className={styles.subtitle}>Monitor and manage all compliance projects</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
          <FolderPlus size={18} />
          Create Project
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Search Projects</label>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, client, company, industry..."
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
            <option value="all">All Statuses ({projects.length})</option>
            <option value="Assigned">Assigned ({getFilteredCount("Assigned")})</option>
            <option value="Started">Started ({getFilteredCount("Started")})</option>
            <option value="In Progress">In Progress ({getFilteredCount("In Progress")})</option>
            <option value="Completed">Completed ({getFilteredCount("Completed")})</option>
            <option value="Not Started">Not Started ({getFilteredCount("Not Started")})</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Auditor</label>
          <select value={auditorFilter} onChange={(e) => setAuditorFilter(e.target.value)} className={styles.select}>
            <option value="all">All Auditors</option>
            <option value="unassigned">Unassigned</option>
            {auditors.map((auditor) => (
              <option key={auditor._id} value={auditor._id}>
                {auditor.email.split('@')[0]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.select}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Project Name</option>
            <option value="client">Client Name</option>
          </select>
        </div>
      </div>

      {hasActiveFilters() && (
        <div className={styles.filterSummary}>
          <div className={styles.filterBadges}>
            <span className={styles.resultsSummary}>
              Showing {filteredProjects.length} of {projects.length} projects
            </span>
            {searchQuery && (
              <span className={styles.filterBadge}>
                Search: "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"
              </span>
            )}
            {statusFilter !== "all" && (
              <span className={styles.filterBadge}>Status: {statusFilter}</span>
            )}
            {auditorFilter !== "all" && (
              <span className={styles.filterBadge}>
                Auditor: {auditorFilter === "unassigned" ? "Unassigned" : auditors.find(a => a._id === auditorFilter)?.email.split('@')[0]}
              </span>
            )}
            {sortBy !== "newest" && (
              <span className={styles.filterBadge}>
                Sort: {sortBy === "oldest" ? "Oldest First" : sortBy === "name" ? "By Name" : "By Client"}
              </span>
            )}
          </div>
          <button onClick={clearAllFilters} className={styles.clearAllBtn}>
            <XCircle size={16} />
            Clear All Filters
          </button>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Briefcase size={40} />
          </div>
          <h3>{projects.length === 0 ? "No projects created yet" : "No projects match your filters"}</h3>
          <p>{projects.length === 0 ? "Get started by creating your first compliance project." : "Try adjusting your search criteria or clear filters to see all projects."}</p>
          {projects.length === 0 ? (
            <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
              Create Your First Project
            </button>
          ) : (
            <button className={styles.secondaryBtn} onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Project Name</th>
                  <th className={styles.th}>Client Name</th>
                  <th className={styles.th}>Auditor Assigned</th>
                  <th className={styles.thCenter}>Reporting Period</th>
                  <th className={styles.thCenter}>Created Date</th>
                  <th className={styles.thCenter}>Status</th>
                  <th className={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProjects.map((project) => {
                  const statusColor = getStatusColor(project.status)
                  return (
                    <tr key={project._id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.projectNameCell}>
                          <div className={styles.avatar}>
                            {project.projectName.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.projectInfo}>
                            <div className={styles.projectName}>{project.projectName}</div>
                            <div className={styles.projectIndustry}>{project.industry}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.clientInfo}>
                          <div className={styles.clientName}>{project.clientName}</div>
                          <div className={styles.companyName}>{project.companyName}</div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        {project.assignedAuditor?.email ? (
                          <div className={styles.assignedUser}>
                            <div className={styles.avatarMini}>
                              {project.assignedAuditor.email.charAt(0).toUpperCase()}
                            </div>
                            <span className={styles.auditorName}>{project.assignedAuditor.email.split('@')[0]}</span>
                          </div>
                        ) : (
                          <span className={styles.unassigned}>Unassigned</span>
                        )}
                      </td>
                      <td className={styles.tdCenter}>
                        {project.reportingPeriod ? (
                          <div className={styles.periodInfo}>
                            <div className={styles.periodYear}>
                              {project.reportingPeriod.periodType === "financial" ? "FY" : "CY"} {project.reportingPeriod.year}
                            </div>
                            <div className={styles.periodType}>
                              {project.reportingPeriod.periodType === "financial" ? "Financial Year" : "Calendar Year"}
                            </div>
                          </div>
                        ) : (
                          <span className={styles.unassigned}>Not set</span>
                        )}
                      </td>
                      <td className={styles.tdCenter}>
                        {formatDate(project.createdAt)}
                      </td>
                      <td className={styles.tdCenter}>
                        <span className={styles.badge} style={{ background: statusColor.bg, color: statusColor.color }}>
                          {getStatusIcon(project.status)}
                          {project.status}
                        </span>
                      </td>
                      <td className={styles.tdCenter}>
                        <button className={styles.textLink}>View Details</button>
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
            totalItems={filteredProjects.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.stepperHeader}>
              <div className={styles.stepperProgress}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`${styles.step} ${step >= s ? styles.stepActive : ''} ${step === s ? styles.stepCurrent : ''}`}
                  >
                    {s}
                  </div>
                ))}
              </div>
              <h2 className={styles.modalTitle}>
                {step === 1 && "Project Information"}
                {step === 2 && "Client Details"}
                {step === 3 && "Reporting Period & Auditor"}
              </h2>
            </div>

            <div className={styles.modalForm}>
              {step === 1 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Project Name *</label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Industry Type *</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      required
                      className={styles.input}
                    >
                      <option value="">Select Industry</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Banking">Banking</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Technology">Technology</option>
                      <option value="Retail">Retail</option>
                    </select>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Project Description</label>
                    <textarea
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      className={styles.textarea}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Client Name *</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Client Email *</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Contact Number *</label>
                    <input
                      type="tel"
                      value={formData.clientNumber}
                      onChange={(e) => setFormData({ ...formData, clientNumber: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <div className={styles.periodSelector}>
                      <div className={styles.periodHeader}>
                        <Calendar size={16} />
                        Reporting Period
                      </div>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Period Type *</label>
                          <select
                            value={formData.reportingPeriod.periodType}
                            onChange={(e) => setFormData({
                              ...formData,
                              reportingPeriod: {
                                periodType: e.target.value,
                                year: e.target.value === "financial" ? "2024-25" : "2025"
                              }
                            })}
                            className={styles.input}
                          >
                            <option value="financial">Financial Year</option>
                            <option value="calendar">Calendar Year</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            {formData.reportingPeriod.periodType === "financial" ? "Financial Year *" : "Calendar Year *"}
                          </label>
                          <select
                            value={formData.reportingPeriod.year}
                            onChange={(e) => setFormData({
                              ...formData,
                              reportingPeriod: {
                                ...formData.reportingPeriod,
                                year: e.target.value
                              }
                            })}
                            className={styles.input}
                          >
                            {formData.reportingPeriod.periodType === "financial" ? (
                              <>
                                <option value="2025-26">2025-26</option>
                                <option value="2024-25">2024-25</option>
                                <option value="2023-24">2023-24</option>
                                <option value="2022-23">2022-23</option>
                              </>
                            ) : (
                              <>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Assign Auditor (Optional)</label>
                    <select
                      value={formData.assignedAuditor}
                      onChange={(e) => setFormData({ ...formData, assignedAuditor: e.target.value })}
                      className={styles.input}
                    >
                      <option value="">Choose an Auditor</option>
                      {auditors
                        .filter((auditor) => auditor.isActive)
                        .map((auditor) => (
                          <option key={auditor._id} value={auditor._id}>
                            {auditor.email.split("@")[0]} ({auditor.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
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