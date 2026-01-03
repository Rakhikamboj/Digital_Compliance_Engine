import { useState } from "react"
import Sidebar from "../components/sidebar"
import Header from "../components/Header"
import AuditorManagement from "./AuditorManagement"
import ProjectManagement from "./ProjectManagement"
import styles from "../styles/Dashboard.module.css"

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("auditors")

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      <div className={styles.mainContent}>
        <Header user={user} onLogout={onLogout} />
        <div className={styles.contentBody}>
          {activeTab === "auditors" ? <AuditorManagement /> : <ProjectManagement />}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
