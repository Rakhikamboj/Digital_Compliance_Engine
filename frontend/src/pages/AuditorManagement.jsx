import { useState, useEffect } from "react"
import { UserPlus, MoreVertical, X, Users } from "lucide-react"

const API_URL = "http://localhost:5000"

const AuditorManagement = () => {
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    auditorName: "",
    email: "",
    phoneNumber: "",
    password: "",
    companyName: "",
    status: "Active",
  })

  useEffect(() => {
    fetchAuditors()
  }, [])

  const fetchAuditors = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      
      if (!token || token === "undefined" || token === "null") {
        console.error("AuditorManagement: No valid token available")
        setError("Authentication required. Please login again.")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/admin/auditors`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched auditors:", data)
        setAuditors(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("AuditorManagement: Fetch failed", response.status, errorData.message)
        setError(errorData.message || "Failed to fetch auditors")
        
        if (response.status === 401) {
          localStorage.removeItem("token")
          setError("Session expired. Please login again.")
        }
      }
    } catch (error) {
      console.error("Fetch auditors error:", error)
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAuditor = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        alert("Authentication required. Please login again.")
        return
      }

      const response = await fetch(`${API_URL}/api/admin/auditors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          isActive: formData.status === "Active",
        }),
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchAuditors()
        setFormData({
          auditorName: "",
          email: "",
          phoneNumber: "",
          password: "",
          companyName: "",
          status: "Active",
        })
        alert("Auditor created successfully!")
      } else {
        const data = await response.json()
        alert(data.message || "Failed to create auditor")
      }
    } catch (error) {
      console.error("Create auditor error:", error)
      alert("Network error. Please try again.")
    }
  }

  const styles = {
    container: {
      animation: 'fadeInUp 0.5s ease',
      marginTop: '60px',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
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
      fontSize: '32px',
      fontWeight: '700',
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
      minWidth: '900px'
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
      padding: '10px 24px',
      fontSize: '13px',
      fontWeight: '500',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    tr: {
      borderBottom: '1px solid #f5f8ee',
      
      transition: 'all 0.3s ease'
    },
    td: {
      padding: '20px 24px',
      fontSize: '15px',
      color: '#374151',
      fontWeight: '500',
      verticalAlign: 'middle'
    },
    tdCenter: {
      padding: '10px 20px',
      textAlign: 'center'
    },
    userNameCell: {
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
    badgeActive: {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#16a34a'
    },
    badgeInactive: {
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#dc2626'
    },
    iconBtn: {
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      background: '#f5f8ee',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#194d2a',
      transition: 'all 0.2s ease'
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
    modalHeader: {
      padding: '28px 32px',
      borderBottom: '1px solid #f5f8ee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #fefffa 0%, #ffffff 100%)'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#194d2a',
      margin: 0
    },
    closeBtn: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      background: '#f5f8ee',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#194d2a',
      transition: 'all 0.2s ease'
    },
    modalForm: {
      padding: '32px',
      overflowY: 'auto',
      flex: 1
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
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
    modalFooter: {
      padding: '24px 32px',
      borderTop: '1px solid #f5f8ee',
      display: 'flex',
      justifyContent: 'flex-end',
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
        `}
      </style>

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Auditor Management</h2>
          <p style={styles.subtitle}>Manage and monitor organization auditors</p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Add Auditor</span>
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading auditors...</p>
        </div>
      ) : auditors.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Users size={48} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#194d2a', marginBottom: '12px' }}>
            No auditor is created yet
          </h3>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
            Get started by adding your first auditor to the system.
          </p>
          <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} />
            <span>Add Your First Auditor</span>
          </button>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Auditor Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone Number</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {auditors.map((auditor) => (
                  <tr key={auditor._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.userNameCell}>
                        <div style={styles.avatar}>
                          {(auditor.auditorName || auditor.email).charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '600', color: '#194d2a' }}>
                          {auditor.auditorName || auditor.email.split("@")[0]}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>{auditor.email}</td>
                    <td style={styles.td}>{auditor.phoneNumber || "N/A"}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(auditor.isActive ? styles.badgeActive : styles.badgeInactive)
                      }}>
                        {auditor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={styles.tdCenter}>
                      <button style={styles.iconBtn} title="More options">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create New Auditor</h3>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Auditor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter auditor name"
                    value={formData.auditorName}
                    onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Auditor Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="auditor@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 234 567 8900"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                {/* <div style={styles.formGroup}>
                  <label style={styles.label}>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Company name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={styles.input}
                  />
                </div> */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={styles.input}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button style={styles.primaryBtn} onClick={handleCreateAuditor}>
                <UserPlus size={18} />
                <span>Create Auditor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditorManagement