import { useState, useEffect } from "react"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import AdminDashboard from "./pages/AdminDashboard"
import AuditorDashboard from "./pages/AuditorDashbaord"
const API_URL = import.meta.env.VITE_API_KEY 
const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data = await response.json()
          if (response.ok) {
            setUser(data)
          } else {
            localStorage.removeItem("token")
          }
        } catch (error) {
          console.error("Auth verify error:", error)
        }
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  if (loading) return <div className="flex items-center justify-center h-screen font-sans">Loading...</div>

  if (!user) return <Auth onLogin={handleLogin} />

  // Route based on role
  if (user.role === "ADMIN") {
    return <AdminDashboard user={user} onLogout={handleLogout} />
  }

  if (user.role === "AUDITOR") {
    return <AuditorDashboard user={user} onLogout={handleLogout} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
