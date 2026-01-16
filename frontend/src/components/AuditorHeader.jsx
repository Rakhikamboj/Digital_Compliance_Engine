import { useState } from "react";
import { Briefcase, ChevronDown, LogOut } from "lucide-react";
import styles from "../styles/AuditorHeader.module.css"

const AuditorHeader = ({ user, onLogout }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <div className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Briefcase size={24} />
        </div>

        <div>
          <div className={styles.logoText}>ESG Waste Evaluation</div>
          <div className={styles.logoSubtext}>
            Environmental Management System
          </div>
        </div>
      </div>

      <div className={styles.userWrapper}>
        <button
          className={styles.userButton}
          onClick={() => setShowUserDropdown((prev) => !prev)}
        >
          <div className={styles.avatar}>
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {user?.auditorName ||
                user?.email?.split("@")[0] ||
                "Auditor"}
            </div>
            <div className={styles.userRole}>Auditor</div>
          </div>

          <ChevronDown size={18} className={styles.chevronIcon} />
        </button>

        {showUserDropdown && (
          <div className={styles.dropdown}>
            <button
              className={`${styles.dropdownItem} ${styles.logout}`}
              onClick={
               // 🔑 prevents dropdown click issues
                onLogout         
              }
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditorHeader;
