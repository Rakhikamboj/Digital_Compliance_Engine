import { LogOut } from "lucide-react"
import styles from "../styles/Dashboard.module.css"

const Header = ({ user, onLogout }) => {
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

  return (
    <header className={styles.header}>
      <div>
        <div className={styles.headerTitle}>
          {getGreeting()}, {user?.email?.split("@")[0] || "User"} 👋
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: '400' }}>
          {getCurrentDate()}
        </div>
      </div>

      <div className={styles.headerActions}>
        
        {onLogout && (
          <button 
            className={styles.logoutBtn} 
            onClick={onLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              marginLeft: '8px'
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  )
}

export default Header