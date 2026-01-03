import { Users, LayoutGrid, LogOut, ShieldCheck } from "lucide-react"
import styles from "../styles/Dashboard.module.css"

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: "auditors", label: "Auditor Management", icon: Users },
    { id: "projects", label: "Projects", icon: LayoutGrid },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <ShieldCheck className={styles.logoIcon} />
        <h2 className={styles.sidebarTitle}>Admin Panel</h2>
      </div>

      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeTab === item.id ? styles.navActive : ""}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
