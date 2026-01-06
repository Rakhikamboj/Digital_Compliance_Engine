import { Users, FolderKanban, LogOut, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"
import styles from "../styles/Layout.module.css"

const Sidebar = ({ activeTab, setActiveTab, onLogout, isCollapsed, setIsCollapsed }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Toggle Button */}
      <button 
        className={styles.toggleBtn} 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Logo Section */}
     <div>
        <div className={styles.logoText}>         
          {!isCollapsed }
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.sidebarNav}>
        <button
          className={`${styles.navItem} ${activeTab === "dashboard" ? styles.navItemActive : ""}`}
          onClick={() => setActiveTab("dashboard")}
          title="Dashboard"
        >
          <BarChart3 size={20} className={styles.navIcon} />
          {!isCollapsed && <span>Dashboard</span>}
        </button>

        <button
          className={`${styles.navItem} ${activeTab === "auditors" ? styles.navItemActive : ""}`}
          onClick={() => setActiveTab("auditors")}
          title="Auditor Management"
        >
          <Users size={20} className={styles.navIcon} />
          {!isCollapsed && <span>Auditor Management</span>}
        </button>

        <button
          className={`${styles.navItem} ${activeTab === "projects" ? styles.navItemActive : ""}`}
          onClick={() => setActiveTab("projects")}
          title="Project Management"
        >
          <FolderKanban size={20} className={styles.navIcon} />
          {!isCollapsed && <span>Project Management</span>}
        </button>
      </nav>

      {/* User Profile & Logout */}
      <div className={styles.sidebarFooter}>
        {!isCollapsed && (
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {(user.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {user.email?.split("@")[0] || "Admin"}
              </div>
              <div className={styles.userRole}>Administrator</div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className={styles.userAvatarCollapsed}>
            {(user.email || "A").charAt(0).toUpperCase()}
          </div>
        )}

        <button 
          className={styles.logoutBtn} 
          onClick={onLogout}
          title="Logout"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar