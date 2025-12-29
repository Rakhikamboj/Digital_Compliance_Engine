import { useState, useEffect } from "react"
import { Leaf, ChevronDown, LogOut, LayoutDashboard, Settings } from "lucide-react"
import styles from "../styles/Header.module.css"

const Header = ({ onLogout, token }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [companyName, setCompanyName] = useState("Organization")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      // If no token is provided, stop loading
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setCompanyName(data.companyName)
          
        } else if (response.status === 401) {
          // Token is invalid or expired
          console.error("Authentication failed")
          onLogout?.()
        } else {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
          console.error("Server error:", errorData.message)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [token, onLogout])

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <Leaf size={24} className={styles.logoIcon} />
          </div>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Digital Compliance Engine</h1>
            <span className={styles.badge}>ESG Verified</span>
          </div>
        </div>

        <div className={styles.userSection}>
          <div className={styles.profileTrigger} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{loading ? "Loading..." : companyName}</span>
              {/* <span className={styles.userRole}>System Administrator</span> */}
            </div>
            <ChevronDown size={16} className={`${styles.chevron} ${dropdownOpen ? styles.rotated : ""}`} />
          </div>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                <Settings size={16} />
                Settings
              </button>
              <div className={styles.divider} />
              <button
                className={`${styles.dropdownItem} ${styles.logout}`}
                onClick={() => {
                  setDropdownOpen(false)
                  onLogout?.()
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header