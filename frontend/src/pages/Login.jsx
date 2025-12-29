import { useState } from "react";
import { Trash2 } from "lucide-react";
import styles from "./LoginPage.module.css";

const LoginPage = ({ onLogin, onSignup }) => {
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', organization: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      onLogin(loginForm);
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (signupForm.name && signupForm.email && signupForm.password && signupForm.organization) {
      onSignup(signupForm);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>
            <Trash2 size={22} />
            WasteTrack Pro
          </h1>
          <p className={styles.headerSubtitle}>Zero-Waste Compliance & Scoring Module</p>
        </div>

        <div className={styles.content}>
          <div className={styles.tabContainer}>
            <button
              onClick={() => setShowLogin(true)}
              className={`${styles.tab} ${showLogin ? styles.tabActive : ''}`}
            >
              Login
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className={`${styles.tab} ${!showLogin ? styles.tabActive : ''}`}
            >
              Sign Up
            </button>
          </div>

          {showLogin ? (
            <form onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  required
                  className={styles.input}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="you@company.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  required
                  className={styles.input}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className={styles.submitButton}>
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Organization</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={signupForm.organization}
                  onChange={(e) => setSignupForm({ ...signupForm, organization: e.target.value })}
                  placeholder="Your Company Name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  required
                  className={styles.input}
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="you@company.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  required
                  className={styles.input}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className={styles.submitButton}>
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;