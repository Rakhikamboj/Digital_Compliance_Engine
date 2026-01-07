import { Search, X } from "lucide-react"

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = "" 
}) => {
  return (
    <div style={styles.searchContainer} className={className}>
      <Search size={18} style={styles.searchIcon} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.searchInput}
      />
      {value && (
        <button 
          onClick={() => onChange("")} 
          style={styles.clearButton}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

const styles = {
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px'
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#6b7280',
    pointerEvents: 'none',
    zIndex: 1
  },
  searchInput: {
    width: '100%',
    padding: '10px 40px 10px 44px',
    fontSize: '14px',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  clearButton: {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  }
}

// Add hover styles
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  input[style*="searchInput"]:focus {
    border-color: #9ca3af;
    box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
  }
  
  button[style*="clearButton"]:hover {
    background-color: #f3f4f6;
    color: #6b7280;
  }
`
if (!document.head.querySelector('style[data-searchbar-styles]')) {
  styleSheet.setAttribute('data-searchbar-styles', 'true')
  document.head.appendChild(styleSheet)
}

export default SearchBar