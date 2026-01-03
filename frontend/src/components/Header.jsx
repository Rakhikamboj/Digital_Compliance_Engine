import { useState, useEffect } from "react"
import { Leaf, ChevronDown, LogOut, LayoutDashboard, Settings } from "lucide-react"
import styles from "../styles/Header.module.css"
const API_URL = import.meta.env.VITE_API_KEY 
const Header = ({ onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [companyName, setCompanyName] = useState("Organization")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token")

        console.log(" Header: Checking session token...")

        if (!token || token === "undefined" || token === "null") {
          console.log(" Header: No valid session token found")
          setLoading(false)
          return
        }

        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log(" Header: User profile retrieved for", data.companyName)
          setCompanyName(data.companyName || "Organization")
        } else {
          console.error(" Header: Profile fetch failed", response.status)

          if (response.status === 401) {
            console.log(" Header: Session expired or invalid, logging out")
            localStorage.removeItem("token")
            onLogout()
          }
        }
      } catch (error) {
        console.error(" Header: Network error during profile fetch", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [onLogout])

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
              <span className={styles.userRole}>System Administrator</span>
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
                  onLogout()
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
