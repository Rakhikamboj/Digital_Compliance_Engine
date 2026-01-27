import { useState, useEffect } from "react"
import { Briefcase, RefreshCw, FileText, Users, FolderKanban, TrendingUp } from "lucide-react"

const API_URL = import.meta.env.VITE_API_KEY

const getCurrentDate = () => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('en-US', options)
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const AdminComplianceDashboard = ({ user }) => {
  const [projects, setProjects] = useState([])
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const [projectsRes, auditorsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/auditors`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }

      if (auditorsRes.ok) {
        const auditorsData = await auditorsRes.json()
        setAuditors(auditorsData)
      }
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const completedProjects = projects.filter(p => p.status === "Completed").length
  const inProgressProjects = projects.filter(p => p.status === "In Progress").length
  const activeAuditors = auditors.filter(a => a.isActive).length
  const unassignedProjects = projects.filter(p => !p.assignedAuditor).length


  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>
            {getGreeting()}, {user?.name || "Administrator"}
          </h1>
          <p style={styles.date}>{getCurrentDate()}</p>
        </div>
      </div>

      {/* Title Section */}
      <div style={styles.titleSection}>
        <h2 style={styles.title}>Compliance Dashboard</h2>
        <p style={styles.subtitle}>Overview of all projects, auditors, and compliance metrics</p>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard
          icon={<Briefcase size={24} />}      
          value={projects.length}         
          trend={null}
          label="Total Projects"
        />
        
        <StatCard
          icon={<RefreshCw size={24} />}
          value={inProgressProjects}
          label="In Progress"
          trend={null}
        />
        
        <StatCard
          icon={<FileText size={24} />}
          value={completedProjects}
          label="Completed"
         
        />
        
        <StatCard
          icon={<Users size={24} />}
          value={activeAuditors}
          label="Active Auditors"
          trend={null}
        />
        
        <StatCard
          icon={<FolderKanban size={24} />}
          value={unassignedProjects}
          label="Unassigned Projects"
          trend={unassignedProjects > 0 ? "Requires attention" : null}
        />
      </div>
    </div>
  )
}

const StatCard = ({ icon, value, label, trend }) => {
  return (
    <div style={styles.statCard}>
      <div style={styles.statCardHeader}>
        <div style={styles.iconWrapper}>
          {icon}
        </div>
        <div style={styles.labelWrapper}>
          <div style={styles.statLabel}>{label}</div>
          {trend && <div style={styles.statTrend}>{trend}</div>}
        </div>
      </div>
      <div style={styles.statCardBody}>
        <div style={styles.statValue}>{value}</div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e7eb'
  },
  greeting: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    letterSpacing: '-0.025em'
  },
  date: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '400'
  },
  titleSection: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    letterSpacing: '-0.0125em'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '400'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease',
    cursor: 'default',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  statCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px'
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4b5563',
    flexShrink: 0
  },
  labelWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    paddingTop: '4px'
  },
  statCardBody: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: '1',
    letterSpacing: '-0.02em'
  },
  statLabel: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
    lineHeight: '1.3'
  },
  statTrend: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '400',
    lineHeight: '1.3'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #4b5563',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#6b7280',
    fontSize: '14px'
  }
}

// Add keyframes for spinner animation
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  [style*="statCard"]:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`
document.head.appendChild(styleSheet)

export default AdminComplianceDashboard