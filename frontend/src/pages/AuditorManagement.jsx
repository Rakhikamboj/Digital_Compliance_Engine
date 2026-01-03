import { useState, useEffect } from "react"
import { UserPlus, MoreVertical, X, Users } from "lucide-react"
import styles from "../styles/Dashboard.module.css"
const API_URL = import.meta.env.VITE_API_KEY 

const AuditorManagement = () => {
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      const token = localStorage.getItem("token")
      console.log("AuditorManagement: Fetching auditors. Token exists:", !!token)

      if (!token || token === "undefined" || token === "null") {
        console.error("AuditorManagement: No valid token available")
        setLoading(false)
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("AuditorManagement: Fetch failed", response.status, errorData.message)
        if (response.status === 401) {
          localStorage.removeItem("token")
          // Logic to redirect to login would go here if available
        }
      }
    } catch (error) {
      console.error("Fetch auditors error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAuditor = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
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
      } else {
        const data = await response.json()
        alert(data.message)
      }
    } catch (error) {
      console.error("Create auditor error:", error)
    }
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Auditor Management</h2>
          <p className={styles.sectionSubtitle}>Manage and monitor organization auditors</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Add Auditor</span>
        </button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading auditors...</div>
      ) : auditors.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Users size={48} />
          </div>
          <h3>No auditor is created yet</h3>
          <p>Get started by adding your first auditor to the system.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Auditor Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {auditors.map((auditor) => (
                <tr key={auditor._id}>
                  <td>
                    <div className={styles.userName}>
                      <div className={styles.avatar}>{auditor.email.charAt(0).toUpperCase()}</div>
                      <span>{auditor.email.split("@")[0]}</span>
                    </div>
                  </td>
                  <td>{auditor.email}</td>
                  <td>{auditor.phoneNumber || "N/A"}</td>
                  <td>
                    <span className={`${styles.badge} ${auditor.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                      {auditor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className={styles.iconBtn}>
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create New Auditor</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleCreateAuditor}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Auditor Name</label>
                  <input
                    type="text"
                    required
                    value={formData.auditorName}
                    onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Auditor Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Create Auditor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditorManagement
