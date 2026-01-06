import { useState, useEffect } from "react"
import { Briefcase, RefreshCw, FileText, BarChart3, Eye, Users, FolderKanban } from "lucide-react"
import styles from "../styles/Layout.module.css"

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
const AdminComplianceDashboard = ( user) => {
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

  // const projectsWithEntries = projects.map(p => ({
  //   ...p,
  //   entryCount: Math.floor(Math.random() * 15) + 1
  // }))

  // const totalEntries = projectsWithEntries.reduce((sum, p) => sum + p.entryCount, 0)
  const completedProjects = projects.filter(p => p.status === "Completed").length
  const inProgressProjects = projects.filter(p => p.status === "In Progress" || p.status === "Started").length
  const activeAuditors = auditors.filter(a => a.isActive).length

  if (loading) {
    return (
      <div className={styles.sectionContainer}>
        
        <div className={styles.emptyState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.greeting} style={{ marginTop: '4.5rem', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          {getGreeting()}, {user?.name || "Adm"} 👋
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: '400' }}>
          {getCurrentDate()}
        </div>
      <div className={styles.sectionHeaderLeft}>
        <div>
          <h2 className={styles.sectionTitle}>Compliance Dashboard</h2>
          <p className={styles.sectionSubtitle}>Overview of all projects, auditors, and compliance metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statIcon}>
            <Briefcase size={28} />
          </div>
          <div>
            <div style={s.statValue}>{projects.length}</div>
            <div style={s.statLabel}>Total Projects</div>
          </div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <RefreshCw size={28} />
          </div>
          <div>
            <div style={s.statValue}>{inProgressProjects}</div>
            <div style={s.statLabel}>In Progress</div>
          </div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}>
            <FileText size={28} />
          </div>
          <div>
            <div style={s.statValue}>{completedProjects}</div>
            <div style={s.statLabel}>Completed</div>
          </div>
        </div>

        {/* <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <BarChart3 size={28} />
          </div>
          <div>
            <div style={s.statValue}>{totalEntries}</div>
            <div style={s.statLabel}>Total Entries</div>
          </div>
        </div> */}

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={s.statValue}>{activeAuditors}</div>
            <div style={s.statLabel}>Active Auditors</div>
          </div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
            <FolderKanban size={28} />
          </div>
          <div>
            <div style={s.statValue}>{projects.filter(p => !p.assignedAuditor).length}</div>
            <div style={s.statLabel}>Unassigned</div>
          </div>
        </div>
      </div>


    </div>
  )
}

const s = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginTop: '24px'
  },
  statCard: {
    background: '#fff',
    borderRadius: '20px',
    padding: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 4px 24px rgba(25,77,42,0.1)',
    border: '1px solid rgba(25,77,42,0.06)',
    transition: 'all 0.3s ease'
  },
  statIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(25,77,42,0.25)',
    flexShrink: 0
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#194d2a',
    marginBottom: '4px',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600'
  },
  badge: {
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block'
  }
}

export default AdminComplianceDashboard