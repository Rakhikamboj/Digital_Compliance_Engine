import { useState, useEffect } from "react"
import { UserPlus, MoreVertical, X, Users, Search } from "lucide-react"
import styles from "../styles/AuditorManagement.module.css"
import Pagination from "../common/Pagination"

const API_URL = import.meta.env.VITE_API_KEY

const AuditorManagement = () => {
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  // Filter auditors based on search query
  const filteredAuditors = auditors.filter((auditor) => {
    const searchLower = searchQuery.toLowerCase()
    const name = (auditor.auditorName || "").toLowerCase()
    const email = (auditor.email || "").toLowerCase()
    const phone = (auditor.phoneNumber || "").toLowerCase()
    const status = auditor.isActive ? "active" : "inactive"
    
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
      status.includes(searchLower)
    )
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredAuditors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAuditors = filteredAuditors.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Auditor Management</h2>
          <p className={styles.subtitle}>Manage and monitor organization auditors</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Add Auditor</span>
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading auditors...</p>
        </div>
      ) : auditors.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Users size={40} />
          </div>
          <h3 className={styles.emptyTitle}>
            No auditor is created yet
          </h3>
          <p className={styles.emptyText}>
            Get started by adding your first auditor to the system.
          </p>
          <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} />
            <span>Add Your First Auditor</span>
          </button>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className={styles.searchWrapper}>
            <div className={styles.searchContainer}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name, email, phone, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className={styles.clearButton}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className={styles.searchResults}>
                Found {filteredAuditors.length} auditor{filteredAuditors.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {filteredAuditors.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Search size={40} />
              </div>
              <h3 className={styles.emptyTitle}>
                No auditors found
              </h3>
              <p className={styles.emptyText}>
                Try adjusting your search criteria or clear the search to view all auditors.
              </p>
              <button className={styles.secondaryBtn} onClick={() => setSearchQuery("")}>
                <X size={18} />
                <span>Clear Search</span>
              </button>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.th}>Auditor Name</th>
                      <th className={styles.th}>Email</th>
                      <th className={styles.th}>Phone Number</th>
                      <th className={styles.thCenter}>Status</th>
                      <th className={styles.thCenter}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAuditors.map((auditor) => (
                      <tr key={auditor._id} className={styles.tr}>
                        <td className={styles.td}>
                          <div className={styles.userNameCell}>
                            <div className={styles.avatar}>
                              {(auditor.auditorName || auditor.email).charAt(0).toUpperCase()}
                            </div>
                            <span className={styles.auditorName}>
                              {auditor.auditorName || auditor.email.split("@")[0]}
                            </span>
                          </div>
                        </td>
                        <td className={styles.td}>{auditor.email}</td>
                        <td className={styles.td}>{auditor.phoneNumber || "N/A"}</td>
                        <td className={styles.tdCenter}>
                          <span className={`${styles.badge} ${auditor.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                            {auditor.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={styles.tdCenter}>
                          <button className={styles.iconBtn} title="More options">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAuditors.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Auditor</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAuditor}>
              <div className={styles.modalForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Auditor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter auditor name"
                      value={formData.auditorName}
                      onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Auditor Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="auditor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 234 567 8900"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter secure password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={styles.input}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  <UserPlus size={18} />
                  <span>Create Auditor</span>
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