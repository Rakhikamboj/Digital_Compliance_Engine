import { useState, useEffect } from "react"
import { Briefcase, Play, Eye, RefreshCw, ArrowLeft, Plus, Trash2, BarChart3, FileText, ChevronDown, LogOut, User } from "lucide-react"
import ComplianceDashboard from "./Dashboard"
const API_URL = "http://localhost:5000"

const AuditorDashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ setError] = useState(null)
  const [showComplianceDashboard, setShowComplianceDashboard] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("kg")  
  // Waste Entry State
  const [wasteEntries, setWasteEntries] = useState([])
  const [entryLoading, setEntryLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("hazardous")
  const [currentEntry, setCurrentEntry] = useState({
    wasteMaterial: "",
    wasteHandler: "",
    modeOfDisposal: "",
    inputDate: "",
    hazardousData: { total: "", reuse: "", recycle: "", composting: "", incinerationWithHeat: "", incinerationWithoutHeat: "", landfill: "", exemption: "" },
    nonHazardousData: { total: "", reuse: "", recycle: "", composting: "", incinerationWithHeat: "", incinerationWithoutHeat: "", landfill: "", exemption: "" }
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchMyProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchWasteEntries()
    }
  }, [selectedProject])

  const fetchMyProjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${API_URL}/api/auditor/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const fetchWasteEntries = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/waste-entries?projectId=${selectedProject._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const result = await response.json()
        setWasteEntries(result.data || [])
      }
    } catch (err) {
      console.error("Fetch entries error:", err)
    }
  }

  const updateProjectStatus = async (status) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/api/auditor/projects/${selectedProject._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      setProjects(projects.map(p => p._id === selectedProject._id ? { ...p, status } : p))
      setSelectedProject({ ...selectedProject, status })
    } catch (err) {
      console.error("Update status error:", err)
    }
  }

  const handleAddEntry = async () => {
    if (!currentEntry.wasteMaterial.trim()) {
      setErrors({ wasteMaterial: "Waste material is required" })
      return
    }

    const currentData = activeTab === "hazardous" ? currentEntry.hazardousData : currentEntry.nonHazardousData
    
    if (!currentData.total) {
      setErrors({ total: "Total waste is required" })
      return
    }

    setEntryLoading(true)
    const token = localStorage.getItem("token")

    const newEntry = {
      projectId: selectedProject._id,
      wasteMaterial: currentEntry.wasteMaterial,
      wasteHandler: currentEntry.wasteHandler || null,
      modeOfDisposal: currentEntry.modeOfDisposal || null,
      inputDate: currentEntry.inputDate || null,
      unit: currentEntry.unit || "kg",
      includeHazardous: activeTab === "hazardous",
      includeNonHazardous: activeTab === "nonHazardous",
      hazardousData: activeTab === "hazardous" ? currentEntry.hazardousData : null,
      nonHazardousData: activeTab === "nonHazardous" ? currentEntry.nonHazardousData : null
    }

    try {
      const response = await fetch(`${API_URL}/api/waste-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newEntry)
      })

      if (response.ok) {
        const result = await response.json()
        setWasteEntries([...wasteEntries, result.data])
        
        if (wasteEntries.length === 0 && selectedProject.status !== "In Progress" && selectedProject.status !== "Completed") {
          await updateProjectStatus("In Progress")
        }

        setCurrentEntry({
          wasteMaterial: "",
          wasteHandler: "",
          modeOfDisposal: "",
          inputDate: "",
          unit: { selectedUnit },
          hazardousData: { total: "", reuse: "", recycle: "", composting: "", incinerationWithHeat: "", incinerationWithoutHeat: "", landfill: "", exemption: "" },
          nonHazardousData: { total: "", reuse: "", recycle: "", composting: "", incinerationWithHeat: "", incinerationWithoutHeat: "", landfill: "", exemption: "" }
        })
        setErrors({})
      }
    } catch (err) {
      console.error("Add entry error:", err)
    } finally {
      setEntryLoading(false)
    }
  }

  const handleDeleteEntry = async (id) => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`${API_URL}/api/waste-entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      setWasteEntries(wasteEntries.filter(e => e._id !== id))
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  const handleSubmit = async () => {
    if (wasteEntries.length === 0) {
      alert("Add at least one entry before submitting")
      return
    }
    await updateProjectStatus("Completed")
    alert("Project completed successfully!")
    setSelectedProject(null)
    fetchMyProjects()
  }

  const getFieldLabel = (key) => {
    const labels = {
      total: "Total Waste",
      reuse: "Reuse",
      recycle: "Recycle",
      composting: "Composting",
      incinerationWithHeat: "Incineration with Heat Recovery",
      incinerationWithoutHeat: "Incineration without Heat Recovery",
      landfill: "Landfill",
      exemption: "Other Exemption"
    }
    return labels[key] || key
  }

  const renderDisposalInputs = () => {
    const data = activeTab === "hazardous" ? currentEntry.hazardousData : currentEntry.nonHazardousData
    const setData = (newData) => setCurrentEntry({ 
      ...currentEntry, 
      [activeTab === "hazardous" ? "hazardousData" : "nonHazardousData"]: newData 
    })

    return (
      <div style={s.wasteDataSection}>
        <h3 style={s.sectionTitle}>
          {activeTab === "hazardous" ? "Hazardous" : "Non-Hazardous"} Waste Disposal Data
        </h3>
        <div style={s.formGrid}>
          {Object.keys(data).map(key => (
            <div key={key} style={s.formGroup}>
              <label style={s.label}>
                {getFieldLabel(key)}  {key === "total" && "*"}
              </label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                style={s.input} 
                value={data[key]} 
                onChange={(e) => setData({ ...data, [key]: e.target.value })} 
              />
              {key === "total" && errors.total && (
                <span style={s.errorText}>{errors.total}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  

  const Header = () => (
    <div style={s.header}>
      <div style={s.logoContainer}>
        <div style={s.logoIcon}>
          <Briefcase size={24} />
        </div>
        <div>
          <div style={s.logoText}>ESG Waste Evaluation</div>
          <div style={s.logoSubtext}>Environmental Management System</div>
        </div>
      </div>
      
      <div style={{ position: 'relative' }}>
        <button 
          style={s.userButton}
          onClick={() => setShowUserDropdown(!showUserDropdown)}
        >
          <div style={s.avatar}>{user?.email?.charAt(0).toUpperCase() || 'A'}</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#194d2a' }}>
              {user?.auditorName || user?.email?.split('@')[0] || 'Auditor'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Auditor</div>
          </div>
          <ChevronDown size={18} style={{ color: '#6b7280', marginLeft: '8px' }} />
        </button>
        
        {showUserDropdown && (
          <div style={s.dropdown}>
            <button style={s.dropdownItem} onClick={() => { setShowComplianceDashboard(true); setShowUserDropdown(false); setSelectedProject(null) }}>
              <BarChart3 size={18} />
              <span>Compliance Dashboard</span>
            </button>
            <div style={s.dropdownDivider}></div>
            <button style={{ ...s.dropdownItem, color: '#dc2626' }} onClick={onLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const s = {
    container: { padding: '20px', minHeight: '100vh', background: 'linear-gradient(135deg, #fefffa 0%, #f5f8ee 100%)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', background: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(25,77,42,0.1)', position: 'relative' },
    logoContainer: { display: 'flex', alignItems: 'center', gap: '16px' },
    logoIcon: { width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 16px rgba(25,77,42,0.3)' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#194d2a', letterSpacing: '-0.5px' },
    logoSubtext: { fontSize: '13px', color: '#6b7280', fontWeight: '500', marginTop: '2px' },
    userButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px 8px 8px', background: '#f5f8ee', border: '2px solid rgba(25,77,42,0.1)', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.3s ease' },
    avatar: { width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff' },
    dropdown: { position: 'absolute', top: '100%', right: '0', marginTop: '8px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(25,77,42,0.15)', border: '1px solid rgba(25,77,42,0.08)', minWidth: '240px', padding: '8px', zIndex: 1000 },
    dropdownItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '500', color: '#194d2a', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left' },
    dropdownDivider: { height: '1px', background: '#f5f8ee', margin: '8px 0' },
    dashboardTitle: { fontSize: '32px', fontWeight: '700', color: '#194d2a', marginBottom: '6px' },
    title: { fontSize: '32px', fontWeight: '700', color: '#194d2a', marginBottom: '6px' },
    subtitle: { fontSize: '15px', color: '#6b7280' },
    card: { background: '#fff', borderRadius: '20px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 24px rgba(25,77,42,0.1)', border: '1px solid rgba(25,77,42,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    th: { textAlign: 'left', padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', whiteSpace: 'nowrap' },
    td: { padding: '24px', fontSize: '15px', color: '#374151', borderBottom: '1px solid #f5f8ee', fontWeight: '500' },
    btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#f5f8ee', color: '#194d2a', border: '2px solid #194d2a', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '14px', fontWeight: '600', color: '#194d2a', marginBottom: '8px' },
    input: { padding: '14px 16px', border: '2px solid #f5f8ee', borderRadius: '12px', fontSize: '15px', color: '#194d2a', width: '100%', boxSizing: 'border-box', transition: 'all 0.25s ease' },
    badge: { padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'inline-block' },
    emptyState: { textAlign: 'center', padding: '100px 32px', background: '#fff', borderRadius: '20px', border: '2px dashed rgba(25,77,42,0.15)' },
    tabContainer: { display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '2px solid #f5f8ee', paddingBottom: '0' },
    tab: { padding: '16px 32px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'transparent', color: '#6b7280', borderBottom: '3px solid transparent', transition: 'all 0.3s ease', position: 'relative', bottom: '-2px' },
    tabActive: { padding: '16px 32px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'transparent', color: '#194d2a', borderBottom: '3px solid #194d2a', transition: 'all 0.3s ease', position: 'relative', bottom: '-2px' },
    wasteDataSection: { background: 'linear-gradient(135deg, #fefffa 0%, #f5f8ee 100%)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(25,77,42,0.1)' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#194d2a', marginBottom: '20px' },
    errorText: { color: '#dc2626', fontSize: '13px', marginTop: '4px' },
    heading: { fontSize: '24px', fontWeight: '700', color: '#194d2a', marginBottom: '24px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' },
    statCard: { background: '#fff', borderRadius: '20px', padding: '28px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 24px rgba(25,77,42,0.1)', border: '1px solid rgba(25,77,42,0.06)' },
    statIcon: { width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 16px rgba(25,77,42,0.25)' },
    statValue: { fontSize: '36px', fontWeight: '700', color: '#194d2a', marginBottom: '4px' },
    statLabel: { fontSize: '14px', color: '#6b7280', fontWeight: '600' }
  }

  if (showComplianceDashboard) {
    return (
      <>
        <Header />
        <ComplianceDashboard />
      </>
    )
  }

  if (selectedProject) {
    return (
      <>
       <Header />
        <div style={s.container}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button style={s.backBtn} onClick={() => { setSelectedProject(null); fetchMyProjects() }}>
              <ArrowLeft size={18} /> Back to Projects
            </button>
            <h1 style={s.title}>{selectedProject.projectName}</h1>
          </div>

          <div style={s.card}>
            <h2 style={s.heading}>Add Waste Entry</h2>
            
            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Waste Material *</label>
                <input 
                  placeholder="e.g., Plastic, Paper, Metal" 
                  style={s.input} 
                  value={currentEntry.wasteMaterial} 
                  onChange={(e) => setCurrentEntry({ ...currentEntry, wasteMaterial: e.target.value })} 
                />
                {errors.wasteMaterial && <span style={s.errorText}>{errors.wasteMaterial}</span>}
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Waste Handler</label>
                <input 
                  placeholder="Handler or vendor name" 
                  style={s.input} 
                  value={currentEntry.wasteHandler} 
                  onChange={(e) => setCurrentEntry({ ...currentEntry, wasteHandler: e.target.value })} 
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Mode of Disposal</label>
                <input 
                  placeholder="e.g., Recycling center, Landfill" 
                  style={s.input} 
                  value={currentEntry.modeOfDisposal} 
                  onChange={(e) => setCurrentEntry({ ...currentEntry, modeOfDisposal: e.target.value })} 
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Input Date</label>
                <input 
                  type="date" 
                  style={s.input} 
                  value={currentEntry.inputDate} 
                  onChange={(e) => setCurrentEntry({ ...currentEntry, inputDate: e.target.value })} 
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Unit *</label>
                <select 
                  value={selectedUnit} 
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  style={s.input}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="tonnes">Tonnes</option>
                  <option value="metric_tonnes">Metric Tonnes (MT)</option>
                </select>
              </div>
            </div>

            <div style={s.tabContainer}>
              <button 
                style={activeTab === "hazardous" ? s.tabActive : s.tab}
                onClick={() => setActiveTab("hazardous")}
              >
                Hazardous Waste
              </button>
              <button 
                style={activeTab === "nonHazardous" ? s.tabActive : s.tab}
                onClick={() => setActiveTab("nonHazardous")}
              >
                Non-Hazardous Waste
              </button>
            </div>

            {renderDisposalInputs()}

            <button style={s.btn} onClick={handleAddEntry} disabled={entryLoading}>
              <Plus size={16} /> {entryLoading ? "Saving..." : "Add Entry"}
            </button>
          </div>

          {wasteEntries.length > 0 ? (
            <div style={s.card}>
              <h3 style={s.heading}>Entered Waste Data ({wasteEntries.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Material</th>
                      <th style={s.th}>Handler</th>
                      <th style={s.th}>Type</th>
                      <th style={s.th}>Total</th>
                      <th style={s.th}>Unit</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteEntries.map(entry => (
                      <>
                        {entry.includeHazardous && (
                          <tr key={`${entry._id}-h`}>
                            <td style={s.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                                  {entry.wasteMaterial.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: '600', color: '#194d2a' }}>{entry.wasteMaterial}</span>
                              </div>
                            </td>
                            <td style={s.td}>{entry.wasteHandler || "—"}</td>
                            <td style={s.td}>
                              <span style={{ ...s.badge, background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>Hazardous</span>
                            </td>
                            <td style={s.td}>{entry.hazardousData?.total || "—"}</td>
                            <td style={s.td}>{entry.unit || "kg"}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>
                              <button 
                                style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }} 
                                onClick={() => handleDeleteEntry(entry._id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        )}
                        {entry.includeNonHazardous && (
                          <tr key={`${entry._id}-n`}>
                            <td style={s.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                                  {entry.wasteMaterial.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: '600', color: '#194d2a' }}>{entry.wasteMaterial}</span>
                              </div>
                            </td>
                            <td style={s.td}>{entry.wasteHandler || "—"}</td>
                            <td style={s.td}>
                              <span style={{ ...s.badge, background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' }}>Non-Hazardous</span>
                            </td>
                            <td style={s.td}>{entry.nonHazardousData?.total || "—"}</td>
                            <td style={s.td}>{entry.unit || "kg"}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>
                              <button 
                                style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }} 
                                onClick={() => handleDeleteEntry(entry._id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <button style={{ ...s.btn, marginTop: '24px' }} onClick={handleSubmit}>
                Submit Project Data
              </button>
            </div>
          ) : (
            <div style={s.card}>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '15px' }}>
                No waste entries yet. Add your first entry above.
              </p>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={s.container}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={s.title}>My Projects</h1>
          <p style={s.subtitle}>Manage and update your assigned audit projects</p>
        </div>

        {loading ? (
          <div style={s.emptyState}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f5f8ee', borderTopColor: '#194d2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#6b7280' }}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, #ffffff 0%, #fefffa 100%)', borderRadius: '30px', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(25,77,42,0.12)' }}>
              <Briefcase size={48} style={{ color: '#194d2a' }} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#194d2a', marginBottom: '12px' }}>No projects found</h3>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>Assigned projects will appear here.</p>
          </div>
        ) : (
          <div style={s.card}>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Project Name</th>
                    <th style={s.th}>Client</th>
                    <th style={s.th}>Industry</th>
                    <th style={s.th}>Status</th>
                    <th style={{ ...s.th, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => {
                    const statusColor = p.status === "Completed" ? { bg: 'rgba(34,197,94,0.15)', color: '#16a34a' } :
                      p.status === "In Progress" || p.status === "Started" || p.status === "Draft" ? { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' } :
                      { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' }
                    
                    return (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f5f8ee', transition: 'all 0.3s ease' }}>
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #194d2a 0%, #0d3618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#fff', boxShadow: '0 4px 12px rgba(25,77,42,0.25)' }}>
                              {p.projectName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '600', color: '#194d2a' }}>{p.projectName}</span>
                          </div>
                        </td>
                        <td style={s.td}>{p.clientName}</td>
                        <td style={s.td}>{p.industry}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: statusColor.bg, color: statusColor.color }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <button style={s.btn} onClick={() => setSelectedProject(p)}>
                            {p.status === "Assigned" ? <><Play size={16} /> Start</> :
                             (p.status === "In Progress" || p.status === "Started" || p.status === "Draft") ? <><RefreshCw size={16} /> Resume</> :
                             <><Eye size={16} /> View</>}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </>
  )
}

export default AuditorDashboard