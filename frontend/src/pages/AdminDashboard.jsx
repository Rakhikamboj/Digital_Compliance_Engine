import { useState } from "react"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import AuditorManagement from "./AuditorManagement"
import ProjectManagement from "./ProjectManagement"
import AdminComplianceDashboard from "./AdminComplianceDashboard"
import styles from "../styles/Dashboard.module.css"

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={styles.adminLayout}>
      {/* Header - Full Width at Top */}
      <Header user={user} onLogout={onLogout} />
      
      {/* Main Wrapper - Contains Sidebar and Content */}
      <div className={styles.mainWrapper}>
        {/* Sidebar - Below Header */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={onLogout}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        
        {/* Main Content Area */}
        <div className={`${styles.mainContent} ${isCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.contentBody}>
            {activeTab === "dashboard" && <AdminComplianceDashboard />}
            {activeTab === "auditors" && <AuditorManagement />}
            {activeTab === "projects" && <ProjectManagement />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard