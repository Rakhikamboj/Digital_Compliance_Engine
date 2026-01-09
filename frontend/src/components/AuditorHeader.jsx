  import { Briefcase, ChevronDown, LogOut } from "lucide-react"
  import styles from "../styles/AuditorDashboard.module.css"
  import { useState } from "react"

  const AuditorHeader = ({ user, onLogout }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)

return (
    <div className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Briefcase size={24} />
        </div>
        <div>
          <div className={styles.logoText}>ESG Waste Evaluation</div>
          <div className={styles.logoSubtext}>Environmental Management System</div>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <button className={styles.userButton} onClick={() => setShowUserDropdown(!showUserDropdown)}>
          <div className={styles.avatar}>{user?.email?.charAt(0).toUpperCase() || "A"}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {user?.auditorName || user?.email?.split("@")[0] || "Auditor"}
            </div>
            <div className={styles.userRole}>Auditor</div>
          </div>
          <ChevronDown size={18} style={{ color: "#6b7280", marginLeft: "8px" }} />
        </button>

        {showUserDropdown && (
          <div className={styles.dropdown}>
         
           
            <button 
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={onLogout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
    )

}

  export default AuditorHeader;