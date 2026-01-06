import { LogOut, Shield } from "lucide-react"
import styles from "../styles/Layout.module.css"

const Header = ({user }) => {


  return (
    <header className={styles.header}>
      <div>                
            
             <div className={styles.headerTitle}>        
        <span><Shield size={30} color="#194d2a" />  ESG Waste Evaluation</span>           
        </div>
      </div>

      <div className={styles.headerActions}>      
        
           
           {user?.name || "Admin"}
         
      
      </div>
    </header>
  )
}

export default Header