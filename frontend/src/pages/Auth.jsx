import { useState } from "react"
import styles from "../styles/Auth.module.css"

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    companyName: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup"
    try {
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem("token", data.token)
        onLogin(data.user)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Auth error:", error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{isLogin ? "Sign In" : "Create Account"}</h2>
        <p className={styles.subtitle}>
          {isLogin ? "Access your compliance dashboard" : "Register your company for zero-waste scoring"}
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Company Name</label>
              <input
                className={styles.input}
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <button type="submit" className={styles.button}>
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <p className={styles.switchText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className={styles.link} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  )
}

export default Auth
