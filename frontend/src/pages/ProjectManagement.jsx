import { useState, useEffect } from "react"
import { FolderPlus, Search, Filter, Briefcase, CheckCircle, Clock, AlertCircle, X, Calendar, ChevronDown, XCircle } from "lucide-react"

const API_URL = "http://localhost:5000"

const ProjectManagement = () => {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState(null)
  
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
  }, [projects, searchQuery, statusFilter, auditorFilter, sortBy])

  const applyFilters = () => {
    let filtered = [...projects]

    // Search filter - searches in project name, client name, company name, and industry
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

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Auditor filter
    if (auditorFilter !== "all") {
      if (auditorFilter === "unassigned") {
        filtered = filtered.filter(p => !p.assignedAuditor)
      } else {
        filtered = filtered.filter(p => p.assignedAuditor?._id === auditorFilter)
      }
    }

    // Sort
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
     
      if (!token) {
        return
      }

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
        return <CheckCircle size={16} style={{ color: '#16a34a' }} />
      case "In Progress":
      case "Started":
        return <Clock size={16} style={{ color: '#f59e0b' }} />
      case "Not Started":
      case "Assigned":
        return <AlertCircle size={16} style={{ color: '#3b82f6' }} />
      default:
        return <AlertCircle size={16} style={{ color: '#6b7280' }} />
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

  const styles = {
    container: {
      animation: 'fadeInUp 0.5s ease',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      marginTop: '60px',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
      gap: '24px',
      flexWrap: 'wrap'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#194d2a',
      marginBottom: '6px',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '15px',
      color: '#6b7280',
      fontWeight: '400'
    },
    primaryBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px 28px',
      background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(25, 77, 42, 0.25)',
      transition: 'all 0.3s ease'
    },
    // filtersContainer: {
    //   background: '#ffffff',
    //   borderRadius: '16px',
      
    //   padding: '20px',
    //   marginBottom: '2rem',
    //   boxShadow: '0 2px 12px rgba(25, 77, 42, 0.08)',
    //   border: '1px solid rgba(25, 77, 42, 0.06)'
    // },
    filtersRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      gap: '16px',
      marginTop: '32px',
      marginBottom: '16px',
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    filterLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#194d2a',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: '#f5f8ee',
      border: '2px solid #e8f0e3',
      borderRadius: '12px',
      transition: 'all 0.25s ease'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      flex: 1,
      fontSize: '15px',
      background: 'transparent',
      color: '#194d2a',
      fontFamily: 'inherit'
    },
    select: {
      padding: '12px 16px',
      border: '2px solid #e8f0e3',
      borderRadius: '12px',
      fontSize: '15px',
      color: '#194d2a',
      background: '#f5f8ee',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: '500',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23194d2a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      backgroundSize: '16px',
      paddingRight: '40px'
    },
    filterSummary: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: '16px',
      borderTop: '1px solid #e8f0e3'
    },
    filterBadges: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    filterBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)',
      color: '#ffffff',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600'
    },
    clearAllBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: 'rgba(239,68,68,0.1)',
      color: '#dc2626',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    resultsSummary: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '500'
    },
    error: {
      padding: '16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      color: '#dc2626',
      fontSize: '14px',
      marginBottom: '20px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '100px 32px',
      background: 'linear-gradient(135deg, #fefffa 0%, #f5f8ee 100%)',
      borderRadius: '20px',
      border: '2px dashed rgba(25, 77, 42, 0.15)'
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '40px',
      height: '40px',
      border: '4px solid #f5f8ee',
      borderTopColor: '#194d2a',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    emptyIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '120px',
      height: '120px',
      background: 'linear-gradient(135deg, #ffffff 0%, #fefffa 100%)',
      borderRadius: '30px',
      margin: '0 auto 32px',
      color: '#194d2a',
      boxShadow: '0 8px 24px rgba(25, 77, 42, 0.12)'
    },
    tableContainer: {
      background: '#ffffff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(25, 77, 42, 0.1)',
      border: '1px solid rgba(25, 77, 42, 0.06)',
      width: '100%',
      maxWidth: '100%'
    },
    tableWrapper: {
      overflowX: 'auto',
      overflowY: 'visible',
      width: '100%'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1200px'
    },
    thead: {
      background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)'
    },
    th: {
      textAlign: 'left',
      padding: '20px 24px',
      fontSize: '13px',
      fontWeight: '700',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      whiteSpace: 'nowrap'
    },
    thCenter: {
      textAlign: 'center',
      padding: '20px 24px',
      fontSize: '13px',
      fontWeight: '700',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    tr: {
      borderBottom: '1px solid #f5f8ee',
      transition: 'all 0.3s ease'
    },
    td: {
      padding: '24px 24px',
      fontSize: '15px',
      color: '#374151',
      fontWeight: '500',
      verticalAlign: 'middle'
    },
    tdCenter: {
      padding: '24px 24px',
      textAlign: 'center'
    },
    projectNameCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    avatar: {
      width: '42px',
      height: '42px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(25, 77, 42, 0.25)',
      flexShrink: 0
    },
    avatarMini: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      color: '#ffffff',
      flexShrink: 0
    },
    assignedUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    unassigned: {
      color: '#9ca3af',
      fontStyle: 'italic'
    },
    statusCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '0.3px'
    },
    textLink: {
      background: 'none',
      border: 'none',
      color: '#194d2a',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'underline',
      padding: '0'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(25, 77, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    },
    modalContent: {
      background: '#ffffff',
      borderRadius: '20px',
      width: '100%',
      maxWidth: '720px',
      maxHeight: '90vh',
      overflow: 'hidden',
      boxShadow: '0 24px 48px rgba(25, 77, 42, 0.2)',
      display: 'flex',
      flexDirection: 'column'
    },
    stepperHeader: {
      padding: '28px 32px',
      borderBottom: '1px solid #f5f8ee',
      background: 'linear-gradient(135deg, #fefffa 0%, #ffffff 100%)'
    },
    stepperProgress: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '20px'
    },
    step: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '700',
      background: '#f5f8ee',
      color: '#9ca3af',
      transition: 'all 0.3s ease'
    },
    stepActive: {
      background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(25, 77, 42, 0.25)'
    },
    stepCurrent: {
      transform: 'scale(1.1)'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#194d2a',
      margin: 0,
      textAlign: 'center'
    },
    modalForm: {
      padding: '32px',
      overflowY: 'auto',
      flex: 1
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    formGroupFull: {
      display: 'flex',
      flexDirection: 'column',
      gridColumn: 'span 2'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#194d2a',
      marginBottom: '8px'
    },
    input: {
      padding: '14px 16px',
      border: '2px solid #f5f8ee',
      borderRadius: '12px',
      fontSize: '15px',
      color: '#194d2a',
      transition: 'all 0.25s ease',
      fontFamily: 'inherit',
      background: '#ffffff',
      width: '100%',
      boxSizing: 'border-box'
    },
    textarea: {
      padding: '14px 16px',
      border: '2px solid #f5f8ee',
      borderRadius: '12px',
      fontSize: '15px',
      color: '#194d2a',
      transition: 'all 0.25s ease',
      fontFamily: 'inherit',
      background: '#ffffff',
      width: '100%',
      boxSizing: 'border-box',
      resize: 'vertical'
    },
    modalFooter: {
      padding: '24px 32px',
      borderTop: '1px solid #f5f8ee',
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      background: 'linear-gradient(135deg, #ffffff 0%, #fefffa 100%)'
    },
    secondaryBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px 28px',
      background: '#f5f8ee',
      color: '#194d2a',
      border: '2px solid #194d2a',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.25s ease'
    },
    periodSelector: {
      background: '#f5f8ee',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px'
    },
    periodHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#194d2a'
    }
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          input::placeholder, textarea::placeholder {
            color: #9ca3af;
          }
          select:focus, input:focus {
            border-color: #194d2a;
            outline: none;
          }
        `}
      </style>

      <div style={styles.header}>
        <div>
          <h4 style={styles.title}>Project Management</h4>
          <p style={styles.subtitle}>Monitor and manage all compliance projects</p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
          <FolderPlus size={18} />
          <span>Create Project</span>
        </button>
      </div>

      {/* Advanced Filters Section */}
      <div style={styles.filtersContainer}>
        <div style={styles.filtersRow}>
          {/* Search */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search Projects</label>
            <div style={styles.searchBox}>
              <Search size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name, client, company, industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#6b7280' }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select 
              style={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({projects.length})</option>
              <option value="Assigned">Assigned ({getFilteredCount("Assigned")})</option>
              <option value="Started">Started ({getFilteredCount("Started")})</option>
              <option value="In Progress">In Progress ({getFilteredCount("In Progress")})</option>
              <option value="Completed">Completed ({getFilteredCount("Completed")})</option>
              <option value="Not Started">Not Started ({getFilteredCount("Not Started")})</option>
            </select>
          </div>

          {/* Auditor Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Auditor</label>
            <select 
              style={styles.select}
              value={auditorFilter}
              onChange={(e) => setAuditorFilter(e.target.value)}
            >
              <option value="all">All Auditors</option>
              <option value="unassigned">Unassigned</option>
              {auditors.map((auditor) => (
                <option key={auditor._id} value={auditor._id}>
                  {auditor.email.split('@')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sort By</label>
            <select 
              style={styles.select}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Project Name</option>
              <option value="client">Client Name</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters() && (
          <div style={styles.filterSummary}>
            <div style={styles.filterBadges}>
              <span style={styles.resultsSummary}>
                Showing {filteredProjects.length} of {projects.length} projects
              </span>
              {searchQuery && (
                <span style={styles.filterBadge}>
                  Search: "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"
                </span>
              )}
              {statusFilter !== "all" && (
                <span style={styles.filterBadge}>
                  Status: {statusFilter}
                </span>
              )}
              {auditorFilter !== "all" && (
                <span style={styles.filterBadge}>
                  Auditor: {auditorFilter === "unassigned" ? "Unassigned" : auditors.find(a => a._id === auditorFilter)?.email.split('@')[0]}
                </span>
              )}
              {sortBy !== "newest" && (
                <span style={styles.filterBadge}>
                  Sort: {sortBy === "oldest" ? "Oldest First" : sortBy === "name" ? "By Name" : "By Client"}
                </span>
              )}
            </div>
            <button style={styles.clearAllBtn} onClick={clearAllFilters}>
              <X size={16} />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Briefcase size={48} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#194d2a', marginBottom: '12px' }}>
            {projects.length === 0 ? "No projects created yet" : "No projects match your filters"}
          </h3>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
            {projects.length === 0 
              ? "Get started by creating your first compliance project." 
              : "Try adjusting your search criteria or clear filters to see all projects."}
          </p>
          {projects.length === 0 ? (
            <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
              <FolderPlus size={18} />
              <span>Create Your First Project</span>
            </button>
          ) : (
            <button style={styles.primaryBtn} onClick={clearAllFilters}>
              <X size={18} />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Project Name</th>
                  <th style={styles.th}>Client Name</th>
                  <th style={styles.th}>Auditor Assigned</th>
                  <th style={styles.th}>Reporting Period</th>
                  <th style={styles.th}>Created Date</th>
                  <th style={styles.th}>Status</th>
                  {/* <th style={styles.thCenter}>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const statusColor = getStatusColor(project.status)
                  
                  return (
                    <tr key={project._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.projectNameCell}>
                          <div style={styles.avatar}>
                            {project.projectName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#194d2a' }}>
                              {project.projectName}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                              {project.industry}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#374151' }}>
                            {project.clientName}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                            {project.companyName}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {project.assignedAuditor?.email ? (
                          <div style={styles.assignedUser}>
                            <div style={styles.avatarMini}>
                              {project.assignedAuditor.email.charAt(0).toUpperCase()}
                            </div>
                            <span>{project.assignedAuditor.email.split('@')[0]}</span>
                          </div>
                        ) : (
                          <span style={styles.unassigned}>Unassigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {project.reportingPeriod ? (
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#194d2a' }}>
                              {project.reportingPeriod.periodType === "financial" ? "FY" : "CY"} {project.reportingPeriod.year}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {project.reportingPeriod.periodType === "financial" ? "Financial Year" : "Calendar Year"}
                            </div>
                          </div>
                        ) : (
                          <span style={styles.unassigned}>Not set</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '14px', color: '#374151' }}>
                          {formatDate(project.createdAt)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.statusCell}>
                          {getStatusIcon(project.status)}
                          <span style={{ ...styles.badge, background: statusColor.bg, color: statusColor.color }}>
                            {project.status}
                          </span>
                        </div>
                      </td>
                      {/* <td style={styles.tdCenter}>
                        <button style={styles.textLink}>View Details</button>
                      </td> */}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.stepperHeader}>
              <div style={styles.stepperProgress}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    style={{
                      ...styles.step,
                      ...(step >= s ? styles.stepActive : {}),
                      ...(step === s ? styles.stepCurrent : {})
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
              <h3 style={styles.modalTitle}>
                {step === 1 && "Project Information"}
                {step === 2 && "Client Details"}
                {step === 3 && "Reporting Period & Auditor"}
              </h3>
            </div>

            <div style={styles.modalForm}>
              {step === 1 && (
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Project Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Annual Waste Compliance 2024"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Industry Type *</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      required
                      style={styles.input}
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
                  <div style={styles.formGroupFull}>
                    <label style={styles.label}>Project Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the project scope and objectives..."
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      style={styles.textarea}
                    ></textarea>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Client Name *</label>
                    <input
                      type="text"
                      placeholder="Enter client name"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Client Email *</label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact Number *</label>
                    <input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.clientNumber}
                      onChange={(e) => setFormData({ ...formData, clientNumber: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Company Name *</label>
                    <input
                      type="text"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={styles.formGrid}>
                  <div style={styles.formGroupFull}>
                    <div style={styles.periodSelector}>
                      <div style={styles.periodHeader}>
                        <Calendar size={18} />
                        <span>Reporting Period</span>
                      </div>
                      
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Period Type *</label>
                          <select
                            value={formData.reportingPeriod.periodType}
                            onChange={(e) => setFormData({
                              ...formData,
                              reportingPeriod: {
                                periodType: e.target.value,
                                year: e.target.value === "financial" ? "2024-25" : "2025"
                              }
                            })}
                            style={styles.input}
                          >
                            <option value="financial">Financial Year</option>
                            <option value="calendar">Calendar Year</option>
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>
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
                            style={styles.input}
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

                  <div style={styles.formGroupFull}>
                    <label style={styles.label}>Assign Auditor (Optional)</label>
                    <select
                      value={formData.assignedAuditor}
                      onChange={(e) => setFormData({ ...formData, assignedAuditor: e.target.value })}
                      style={styles.input}
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

            <div style={styles.modalFooter}>
              {step > 1 ? (
                <button style={styles.secondaryBtn} onClick={() => setStep(step - 1)}>
                  Back
                </button>
              ) : (
                <button style={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button style={styles.primaryBtn} onClick={() => setStep(step + 1)}>
                  Next Step
                </button>
              ) : (
                <button style={styles.primaryBtn} onClick={handleCreateProject}>
                  <FolderPlus size={18} />
                  <span>Finalize & Create</span>
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