import styles from "../styles/Layout.module.css"

const Header = ({user }) => {

  return (
    <header className={styles.header}>
      <div>                
            
             <div className={styles.headerTitle}>        
        <span> ESG Waste Evaluation</span>           
        </div>
      </div>

      <div className={styles.headerActions}>      
        
           
           {user?.name || "Admin"}
         
      
      </div>
    </header>
  )
}

export default Header