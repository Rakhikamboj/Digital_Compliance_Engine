import React, { useState, useEffect } from "react"
import { Plus, Trash2, BarChart3, ChevronDown, ChevronRight } from "lucide-react"
import styles from "../styles/WasteDataEntry.module.css"
import ComplianceDashboard from "../pages/Dashboard"

const API_URL = import.meta.env.VITE_API_KEY

const WasteDataEntry = ({ onNext, projectInfo }) => {
  const [showDashboard, setShowDashboard] = useState(false)
  const [wasteEntries, setWasteEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fetchLoading, setFetchLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("hazardous")
  const [selectedUnit, setSelectedUnit] = useState("kg")
  const [fieldErrors, setFieldErrors] = useState({})
  const [expandedMonths, setExpandedMonths] = useState({})

  const [currentEntry, setCurrentEntry] = useState({
    wasteMaterial: "",
    wasteHandler: "",
    modeOfDisposal: "",
    inputDate: "",
    hazardousData: {
      total: "",
      reuse: "",
      recycle: "",
      composting: "",
      incinerationWithHeat: "",
      incinerationWithoutHeat: "",
      landfill: "",
      exemption: "",
    },
    nonHazardousData: {
      total: "",
      reuse: "",
      recycle: "",
      composting: "",
      incinerationWithHeat: "",
      incinerationWithoutHeat: "",
      landfill: "",
      exemption: "",
    },
  })

  const [errors, setErrors] = useState({})

  const getReportingPeriodRange = (reportingPeriod) => {
    if (!reportingPeriod || !reportingPeriod.periodType || !reportingPeriod.year) {
      return null
    }

    const { periodType, year } = reportingPeriod
    let startDate, endDate

    const yearNum = Number.parseInt(year, 10)
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return null
    }

    const normalizedPeriodType = periodType === "financial" ? "FY" : periodType

    if (normalizedPeriodType === "FY") {
      startDate = new Date(yearNum, 3, 1)
      endDate = new Date(yearNum + 1, 2, 31)
    } else if (normalizedPeriodType === "CY") {
      startDate = new Date(yearNum, 0, 1)
      endDate = new Date(yearNum, 11, 31)
    } else {
      return null
    }

    return { startDate, endDate }
  }

  const getAuthToken = () => {
    return localStorage.getItem("token")
  }

  const getUserIdFromToken = () => {
    const token = getAuthToken()
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload.id
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  useEffect(() => {
    fetchWasteEntries()
  }, [projectInfo?._id])

  const fetchWasteEntries = async () => {
    try {
      setFetchLoading(true)
      const token = getAuthToken()
      const userId = getUserIdFromToken()
      const projectId = projectInfo?._id

      if (!token || !userId) {
        setError("Please log in to view waste entries")
        setFetchLoading(false)
        return
      }

      const params = new URLSearchParams()
      params.append("userId", userId)
      if (projectId) {
        params.append("projectId", projectId)
      }

      const response = await fetch(`${API_URL}/api/waste-entries?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch entries")
      }

      setWasteEntries(result.data || [])
    } catch (err) {
      console.error("Fetch error:", err)
      setError(err.message || "Failed to load waste entries")
    } finally {
      setFetchLoading(false)
    }
  }

  const validateEntry = () => {
    const newErrors = {}

    if (!currentEntry.wasteMaterial.trim()) {
      newErrors.wasteMaterial = "Waste material is required"
    }

    if (!currentEntry.inputDate) {
      newErrors.inputDate = "Input date is required"
    } else {
      const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod)

      if (dateRange) {
        const { startDate, endDate } = dateRange
        const inputDate = new Date(currentEntry.inputDate)

        inputDate.setHours(0, 0, 0, 0)
        const compareStartDate = new Date(startDate)
        compareStartDate.setHours(0, 0, 0, 0)
        const compareEndDate = new Date(endDate)
        compareEndDate.setHours(23, 59, 59, 999)

        if (inputDate < compareStartDate || inputDate > compareEndDate) {
          const formatDate = (date) => {
            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }

          newErrors.inputDate = `Date must be between ${formatDate(startDate)} and ${formatDate(endDate)}`
        }
      }
    }

    const currentData = activeTab === "hazardous" ? currentEntry.hazardousData : currentEntry.nonHazardousData

    if (!currentData.total || Number.parseFloat(currentData.total) <= 0) {
      newErrors.total = "Total waste must be greater than 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateDiversion = (data) => {
    const total = Number.parseFloat(data.total) || 0

    const diversion =
      (Number.parseFloat(data.reuse) || 0) +
      (Number.parseFloat(data.recycle) || 0) +
      (Number.parseFloat(data.composting) || 0) +
      (Number.parseFloat(data.incinerationWithHeat) || 0) +
      (Number.parseFloat(data.incinerationWithoutHeat) || 0)

    return {
      diversion: diversion.toFixed(2),
      diversionPercent: total > 0 ? ((diversion / total) * 100).toFixed(2) : "0.00",
    }
  }

  const handleAddEntry = async () => {
    if (!validateEntry()) return

    setLoading(true)
    setError("")
    setFieldErrors({})

    const token = getAuthToken()
    const userId = getUserIdFromToken()
    const projectId = projectInfo?._id

    if (!token || !userId) {
      setError("Please log in to add waste entries")
      setLoading(false)
      return
    }

    const reportingPeriod = projectInfo?.reportingPeriod
    const normalizedReportingPeriod = {
      ...reportingPeriod,
      periodType: reportingPeriod?.periodType === "financial" ? "FY" : reportingPeriod?.periodType,
    }

    const inputDateObj = new Date(currentEntry.inputDate)
    const isoInputDate = inputDateObj.toISOString().split("T")[0]

    const newEntry = {
      userId,
      projectId,
      reportingPeriod: normalizedReportingPeriod,
      wasteMaterial: currentEntry.wasteMaterial,
      wasteHandler: currentEntry.wasteHandler || null,
      modeOfDisposal: currentEntry.modeOfDisposal || null,
      inputDate: isoInputDate,
      unit: selectedUnit,
      includeHazardous: activeTab === "hazardous",
      includeNonHazardous: activeTab === "nonHazardous",
      hazardousData: activeTab === "hazardous" ? currentEntry.hazardousData : null,
      nonHazardousData: activeTab === "nonHazardous" ? currentEntry.nonHazardousData : null,
    }

    if (activeTab === "hazardous") {
      const haz = calculateDiversion(currentEntry.hazardousData)
      newEntry.hazardousDiversion = haz.diversion
      newEntry.hazardousDiversionPercent = haz.diversionPercent
    }

    if (activeTab === "nonHazardous") {
      const nonHaz = calculateDiversion(currentEntry.nonHazardousData)
      newEntry.nonHazardousDiversion = nonHaz.diversion
      newEntry.nonHazardousDiversionPercent = nonHaz.diversionPercent
    }

    try {
      const response = await fetch(`${API_URL}/api/waste-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEntry),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.message && result.message.includes("date")) {
          setFieldErrors({ inputDate: result.message })
        } else {
          setError(result.message || "Failed to save entry")
        }
        throw new Error(result.message || "Failed to save entry")
      }

      if (projectId) {
        try {
          await fetch(`${API_URL}/api/auditor/projects/${projectId}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "In-Progress" }),
          })
        } catch (statusError) {
          console.error("Error updating project status:", statusError)
        }
      }

      setWasteEntries((prev) => [...prev, result.data])

      setCurrentEntry({
        wasteMaterial: "",
        wasteHandler: "",
        modeOfDisposal: "",
        inputDate: "",
        hazardousData: {
          total: "",
          reuse: "",
          recycle: "",
          composting: "",
          incinerationWithHeat: "",
          incinerationWithoutHeat: "",
          landfill: "",
          exemption: "",
        },
        nonHazardousData: {
          total: "",
          reuse: "",
          recycle: "",
          composting: "",
          incinerationWithHeat: "",
          incinerationWithoutHeat: "",
          landfill: "",
          exemption: "",
        },
      })

      setErrors({})
    } catch (err) {
      console.error("Add entry error:", err)
      setError(err.message || "Failed to save waste entry")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEntries = async () => {
    const token = getAuthToken()
    const projectId = projectInfo?._id

    if (!token || !projectId) {
      setError("Please log in to submit entries")
      return
    }

    if (wasteEntries.length === 0) {
      setError("Please add at least one waste entry before submitting")
      return
    }

    try {
      await fetch(`${API_URL}/api/auditor/projects/${projectId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "Completed" }),
      })

      if (onNext) {
        onNext(wasteEntries)
      }
    } catch (err) {
      console.error("Submit error:", err)
      setError(err.message || "Failed to submit entries")
    }
  }

  const handleDeleteEntry = async (id) => {
    const token = getAuthToken()

    if (!token) {
      setError("Please log in to delete entries")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/waste-entries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete entry")
      }

      setWasteEntries((prev) => prev.filter((e) => e._id !== id))
    } catch (err) {
      console.error("Delete error:", err)
      setError(err.message || "Failed to delete entry")
    }
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
      exemption: "Other Exemption",
    }
    return labels[key] || key
  }

  const renderDisposalInputs = () => {
    const data = activeTab === "hazardous" ? currentEntry.hazardousData : currentEntry.nonHazardousData

    const setData = (newData) =>
      setCurrentEntry({
        ...currentEntry,
        [activeTab === "hazardous" ? "hazardousData" : "nonHazardousData"]: newData,
      })

    return (
      <div className={styles.wasteDataSection}>
        <h3 className={styles.sectionTitle}>
          {activeTab === "hazardous" ? "Hazardous" : "Non-Hazardous"} Waste Disposal Data
        </h3>
        <div className={styles.formGrid}>
          {Object.keys(data).map((key) => (
            <div key={key} className={styles.formGroup}>
              <label className={styles.label}>
                {getFieldLabel(key)} {key === "total" && "*"}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className={styles.input}
                value={data[key]}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
              {key === "total" && errors.total && <span className={styles.errorText}>{errors.total}</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Group entries by month
  const groupEntriesByMonth = () => {
    const grouped = {}
    
    wasteEntries.forEach(entry => {
      const date = new Date(entry.inputDate)
      const monthKey = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(entry)
    })
    
    return grouped
  }

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }))
  }

  const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod)
  const minDate = dateRange?.startDate ? dateRange.startDate.toISOString().split("T")[0] : ""
  const maxDate = dateRange?.endDate ? dateRange.endDate.toISOString().split("T")[0] : ""

  if (showDashboard) {
    return (
      <div className={styles.container}>
        <button
          onClick={() => setShowDashboard(false)}
          style={{
            marginBottom: "16px",
            padding: "8px 16px",
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back to Waste Entry
        </button>
        <ComplianceDashboard projectSelected={projectInfo} reportingPeriod={projectInfo?.reportingPeriod} />
      </div>
    )
  }

  const groupedEntries = groupEntriesByMonth()

  return (
    <div className={styles.containerWithSidebar}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>All Entries</h3>
        </div>
        
        {fetchLoading ? (
          <div className={styles.sidebarLoading}>Loading entries...</div>
        ) : wasteEntries.length === 0 ? (
          <div className={styles.sidebarEmpty}>No entries yet</div>
        ) : (
          <div className={styles.entriesList}>
            {Object.entries(groupedEntries).map(([monthKey, entries]) => (
              <div key={monthKey} className={styles.monthGroup}>
                <div 
                  className={styles.monthHeader}
                  onClick={() => toggleMonth(monthKey)}
                >
                  <div className={styles.monthInfo}>
                    <span className={styles.monthName}>{monthKey}</span>
                    <span className={styles.entryCount}>({entries.length})</span>
                  </div>
                  {expandedMonths[monthKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                
                {expandedMonths[monthKey] && (
                  <div className={styles.monthEntries}>
                    <div className={styles.tableWrapper}>
                      <table className={styles.sidebarTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Material</th>
                            <th>Handler</th>
                            <th>Type</th>
                            <th>Total</th>
                            <th>Unit</th>
                            <th>Disposal</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => (
                            <React.Fragment key={entry._id}>
                              {entry.includeHazardous && (
                                <tr>
                                  <td>{new Date(entry.inputDate).toLocaleDateString()}</td>
                                  <td>
                                    <div className={styles.materialCell}>
                                      <div className={styles.materialIconSmall}>
                                        {entry.wasteMaterial.charAt(0).toUpperCase()}
                                      </div>
                                      <span>{entry.wasteMaterial}</span>
                                    </div>
                                  </td>
                                  <td>{entry.wasteHandler || "—"}</td>
                                  <td>
                                    <span className={`${styles.badge} ${styles.badgeHazardous}`}>
                                      Hazardous
                                    </span>
                                  </td>
                                  <td>{entry.hazardousData?.total || "—"}</td>
                                  <td>{entry.unit || "kg"}</td>
                                  <td>{entry.modeOfDisposal || "—"}</td>
                                  <td>
                                    <button 
                                      className={styles.deleteBtn}
                                      onClick={() => handleDeleteEntry(entry._id)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              )}
                              {entry.includeNonHazardous && (
                                <tr>
                                  <td>{new Date(entry.inputDate).toLocaleDateString()}</td>
                                  <td>
                                    <div className={styles.materialCell}>
                                      <div className={styles.materialIconSmall}>
                                        {entry.wasteMaterial.charAt(0).toUpperCase()}
                                      </div>
                                      <span>{entry.wasteMaterial}</span>
                                    </div>
                                  </td>
                                  <td>{entry.wasteHandler || "—"}</td>
                                  <td>
                                    <span className={`${styles.badge} ${styles.badgeNonHazardous}`}>
                                      Non-Hazardous
                                    </span>
                                  </td>
                                  <td>{entry.nonHazardousData?.total || "—"}</td>
                                  <td>{entry.unit || "kg"}</td>
                                  <td>{entry.modeOfDisposal || "—"}</td>
                                  <td>
                                    <button 
                                      className={styles.deleteBtn}
                                      onClick={() => handleDeleteEntry(entry._id)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {wasteEntries.length > 0 && (
          <div className={styles.sidebarFooter}>
            <button className={styles.submitBtn} onClick={handleSubmitEntries}>
              Submit All Entries
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div style={{ marginBottom: "32px" }}>
          <h1 className={styles.title}>Waste Data Entry</h1>
          <p className={styles.subtitle}>Add and manage waste disposal entries</p>
        </div>

        {projectInfo && (
          <div className={styles.projectInfo}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 className={styles.projectTitle}>Project Information</h3>
              <button
                onClick={() => setShowDashboard(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#194d2a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <BarChart3 size={16} />
                View Compliance Dashboard
              </button>
            </div>
            <div className={styles.projectDetails}>
              <div className={styles.projectDetail}>
                <div className={styles.projectDetailLabel}>Project Name</div>
                <div>{projectInfo.projectName}</div>
              </div>
              <div className={styles.projectDetail}>
                <div className={styles.projectDetailLabel}>Reporting Period</div>
                <div>
                  {projectInfo.reportingPeriod?.periodType} - {projectInfo.reportingPeriod?.year}
                  {dateRange && (
                    <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "4px" }}>
                     
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.projectDetail}>
                <div className={styles.projectDetailLabel}>Client</div>
                <div>{projectInfo.clientName}</div>
              </div>
             
            </div>
          </div>
        )}

        <div className={styles.card}>
          <h2 className={styles.heading}>Add Waste Entry</h2>

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Waste Material *</label>
              <input
                placeholder="e.g., Plastic, Paper, Metal"
                className={styles.input}
                value={currentEntry.wasteMaterial}
                onChange={(e) => setCurrentEntry({ ...currentEntry, wasteMaterial: e.target.value })}
              />
              {errors.wasteMaterial && <span className={styles.errorText}>{errors.wasteMaterial}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Waste Handler</label>
              <input
                placeholder="Handler or vendor name"
                className={styles.input}
                value={currentEntry.wasteHandler}
                onChange={(e) => setCurrentEntry({ ...currentEntry, wasteHandler: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Mode of Disposal</label>
              <input
                placeholder="e.g., Recycling center, Landfill"
                className={styles.input}
                value={currentEntry.modeOfDisposal}
                onChange={(e) => setCurrentEntry({ ...currentEntry, modeOfDisposal: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Input Date *</label>
              <input
                type="date"
                className={styles.input}
                value={currentEntry.inputDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setCurrentEntry({ ...currentEntry, inputDate: e.target.value })}
              />
              {errors.inputDate && <span className={styles.errorText}>{errors.inputDate}</span>}
              {fieldErrors.inputDate && <span className={styles.errorText}>{fieldErrors.inputDate}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Unit *</label>
              <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className={styles.input}>
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Tonnes</option>
                <option value="metric_tonnes">Metric Tonnes (MT)</option>
              </select>
            </div>
          </div>

          <div className={styles.tabContainer}>
            <button
              className={activeTab === "hazardous" ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab("hazardous")}
            >
              Hazardous Waste
            </button>
            <button
              className={activeTab === "nonHazardous" ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab("nonHazardous")}
            >
              Non-Hazardous Waste
            </button>
          </div>

          {renderDisposalInputs()}

          <button className={styles.btn} onClick={handleAddEntry} disabled={loading}>
            <Plus size={16} /> {loading ? "Saving..." : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WasteDataEntry