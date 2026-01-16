import React, { useState, useEffect, useRef, createContext, useContext } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Leaf, AlertCircle, Download, FileText, X, Trash2 , ChevronLeft} from "lucide-react"

// Toast Context
const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    return { showToast: (msg) => console.log(msg) }
  }
  return context
}

// API Configuration
const API_URL = import.meta.env.VITE_API_KEY + "/api/waste-entries"

// Circular Progress Component
const CircularProgress = ({ percentage, size = 160, primaryColor = "#194d2a" }) => {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8f0e3" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: primaryColor }}>
          {percentage.toFixed(1)}%
        </div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a6c57', letterSpacing: '1px' }}>
          DIVERTED
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ icon, label, value, unit, color, gradient }) => (
  <div className="statCard" style={{ padding: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', color: 'white', background: gradient }}>
        {icon}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#5a6c57' }}>{label}</div>
    </div>
    <div style={{ fontSize: '20px', fontWeight: 700, color: color }}>
      {value}
      <span style={{ fontSize: '11px', fontWeight: 500, marginLeft: '4px', opacity: 0.7 }}>{unit}</span>
    </div>
  </div>
)

// Metric Box Component
const MetricBox = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '12px', color: '#5a6c57', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: 700, color: color }}>{value}</div>
  </div>
)

// Main Compliance Dashboard Component
const ComplianceDashboard = ({ projectSelected, reportingPeriod = { periodType: "financial", year: "2024-25" } }) => {
  const [wasteEntries, setWasteEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const previewRef = useRef(null)
  const { showToast } = useToast()

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("token")
  }

  // Get user ID from token
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

  // Fetch waste entries on component mount
  useEffect(() => {
    fetchWasteEntries()
  }, [projectSelected?.id, reportingPeriod?.year, reportingPeriod?.periodType])

  // Load jsPDF library
  useEffect(() => {
    if (!window.jspdf) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
      script.async = true
      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [])

  const fetchWasteEntries = async () => {
    try {
      setLoading(true)
      setError("")
      const token = getAuthToken()
      const userId = getUserIdFromToken()
      const projectId = projectSelected ? projectSelected._id : null

      if (!token || !userId) {
        setError("Please log in to view waste entries")
        setLoading(false)
        return
      }

      const params = new URLSearchParams()
      params.append("userId", userId)
      if (projectId) {
        params.append("projectId", projectId)
      }
      if (reportingPeriod) {
        params.append("reportingPeriod", JSON.stringify(reportingPeriod))
      }

      const response = await fetch(`${API_URL}?${params.toString()}`, {
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
      setLoading(false)
    }
  }

  const calculateOverallMetrics = () => {
    let hazTotal = 0,
      hazDiv = 0,
      hazExemption = 0
    let nonHazTotal = 0,
      nonHazDiv = 0,
      nonHazExemption = 0

    wasteEntries.forEach((entry) => {
      if (entry.includeHazardous) {
        hazTotal += Number.parseFloat(entry.hazardousData?.total) || 0
        hazDiv += Number.parseFloat(entry.hazardousDiversion) || 0
        hazExemption += Number.parseFloat(entry.hazardousData?.exemptionCategory) || 0
      }
      if (entry.includeNonHazardous) {
        nonHazTotal += Number.parseFloat(entry.nonHazardousData?.total) || 0
        nonHazDiv += Number.parseFloat(entry.nonHazardousDiversion) || 0
        nonHazExemption += Number.parseFloat(entry.nonHazardousData?.exemptionCategory) || 0
      }
    })

    const totalExemption = hazExemption + nonHazExemption
    const overallTotal = hazTotal + nonHazTotal
    const overallDiv = hazDiv + nonHazDiv

    const denominator = overallTotal - totalExemption
    const overallPercent = denominator > 0 ? (overallDiv / denominator) * 100 : 0

    const hazDenominator = hazTotal - hazExemption
    const hazPercent = hazDenominator > 0 ? (hazDiv / hazDenominator) * 100 : 0

    const nonHazDenominator = nonHazTotal - nonHazExemption
    const nonHazPercent = nonHazDenominator > 0 ? (nonHazDiv / nonHazDenominator) * 100 : 0

    const landfill = overallTotal - overallDiv - totalExemption

    return {
      hazTotal,
      hazDiv,
      hazPercent,
      hazExemption,
      nonHazTotal,
      nonHazDiv,
      nonHazPercent,
      nonHazExemption,
      overallTotal,
      overallDiv,
      overallPercent,
      totalExemption,
      landfill: Math.max(0, landfill),
    }
  }

  const metrics = calculateOverallMetrics()

  const getLeadershipBadge = (percent) => {
    if (percent >= 95) return { name: "Zero Waste Champion", color: "#194d2a", icon: "🏆" }
    if (percent >= 90) return { name: "Sustainability Leader", color: "#2d7a3e", icon: "⭐" }
    if (percent >= 75) return { name: "Green Performer", color: "#52a85f", icon: "🌟" }
    if (percent >= 50) return { name: "Eco Contributor", color: "#7bc278", icon: "🌱" }
    return { name: "Getting Started", color: "#95a5a6", icon: "🌿" }
  }

  const badge = getLeadershipBadge(metrics.overallPercent)

  const diversionVsLandfillData = [
    { name: "Diverted", value: metrics.overallDiv, fill: "#194d2a" },
    { name: "Landfill", value: metrics.landfill, fill: "#e74c3c" },
  ]

  const hazardousVsNonHazardousData = [
    { name: "Hazardous", value: metrics.hazTotal, fill: "#c0392b" },
    { name: "Non-Hazardous", value: metrics.nonHazTotal, fill: "#2d7a3e" },
  ]

  // PDF Generation Functions
  const generatePDF = async () => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF("p", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = 20

    const addText = (text, x, y, options = {}) => {
      doc.text(text, x, y, options)
    }

    doc.setFillColor(25, 77, 42)
    doc.rect(0, 0, pageWidth, 40, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    addText("ESG Compliance Report", margin, 20)

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    addText("Zero Waste Performance Summary", margin, 30)

    yPos = 50

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    addText(
      `Reporting Period: ${reportingPeriod.periodType === "financial" ? "FY" : ""} ${reportingPeriod.year}`,
      margin,
      yPos,
    )
    addText(
      `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      pageWidth - margin,
      yPos,
      { align: "right" },
    )

    yPos += 10
    doc.setLineWidth(0.5)
    doc.setDrawColor(232, 240, 227)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 15

    const badgeColor = Number.parseInt(badge.color.replace("#", ""), 16)
    const r = (badgeColor >> 16) & 255
    const g = (badgeColor >> 8) & 255
    const b = badgeColor & 255

    doc.setFillColor(r, g, b)
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")

    addText(badge.name, pageWidth / 2, yPos + 10, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    addText(`Overall Diversion Rate: ${metrics.overallPercent.toFixed(1)}%`, pageWidth / 2, yPos + 18, {
      align: "center",
    })

    yPos += 35

    doc.setTextColor(25, 77, 42)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    addText("Key Performance Metrics", margin, yPos)
    yPos += 10

    const boxWidth = (pageWidth - 2 * margin - 10) / 3
    const boxHeight = 25

    doc.setFillColor(233, 245, 235)
    doc.roundedRect(margin, yPos, boxWidth, boxHeight, 2, 2, "F")
    doc.setTextColor(25, 77, 42)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    addText("Total Waste Generated", margin + boxWidth / 2, yPos + 8, { align: "center" })
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    addText(`${metrics.overallTotal.toFixed(1)} kg`, margin + boxWidth / 2, yPos + 18, { align: "center" })

    doc.setFillColor(233, 245, 235)
    doc.roundedRect(margin + boxWidth + 5, yPos, boxWidth, boxHeight, 2, 2, "F")
    doc.setTextColor(39, 174, 96)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    addText("Waste Diverted", margin + boxWidth + 5 + boxWidth / 2, yPos + 8, { align: "center" })
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    addText(`${metrics.overallDiv.toFixed(1)} kg`, margin + boxWidth + 5 + boxWidth / 2, yPos + 18, { align: "center" })

    doc.setFillColor(254, 242, 242)
    doc.roundedRect(margin + 2 * boxWidth + 10, yPos, boxWidth, boxHeight, 2, 2, "F")
    doc.setTextColor(231, 76, 60)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    addText("Sent to Landfill", margin + 2 * boxWidth + 10 + boxWidth / 2, yPos + 8, { align: "center" })
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    addText(`${metrics.landfill.toFixed(1)} kg`, margin + 2 * boxWidth + 10 + boxWidth / 2, yPos + 18, {
      align: "center",
    })

    yPos += 35

    doc.setTextColor(25, 77, 42)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    addText("Waste Type Analysis", margin, yPos)
    yPos += 8

    if (metrics.hazTotal > 0) {
      doc.setFillColor(248, 215, 218)
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, "F")
      doc.setTextColor(192, 57, 43)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      addText("Hazardous Waste", margin + 5, yPos + 7)
      doc.setFont("helvetica", "normal")
      addText(`Total: ${metrics.hazTotal.toFixed(1)} kg`, margin + 5, yPos + 14)
      addText(`Diverted: ${metrics.hazDiv.toFixed(1)} kg (${metrics.hazPercent.toFixed(1)}%)`, pageWidth / 2, yPos + 14)
      yPos += 22
    }

    if (metrics.nonHazTotal > 0) {
      doc.setFillColor(212, 237, 218)
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, "F")
      doc.setTextColor(45, 122, 62)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      addText("Non-Hazardous Waste", margin + 5, yPos + 7)
      doc.setFont("helvetica", "normal")
      addText(`Total: ${metrics.nonHazTotal.toFixed(1)} kg`, margin + 5, yPos + 14)
      addText(
        `Diverted: ${metrics.nonHazDiv.toFixed(1)} kg (${metrics.nonHazPercent.toFixed(1)}%)`,
        pageWidth / 2,
        yPos + 14,
      )
      yPos += 22
    }
    yPos += 6

    if (yPos > pageHeight - 80) {
      doc.addPage()
      yPos = 20
    }

    doc.setTextColor(25, 77, 42)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    addText("Waste Entries Summary", margin, yPos)

    yPos += 8

    doc.setFillColor(25, 77, 42)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")

    const colX = [margin + 2, margin + 52, margin + 87, margin + 117, margin + 147]

    addText("Material", colX[0], yPos + 6)
    addText("Handler", colX[1], yPos + 6)
    addText("Type", colX[2], yPos + 6)
    addText("Total (kg)", colX[3], yPos + 6)
    addText("Diversion", colX[4], yPos + 6)

    yPos += 10

    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    let rowCount = 0

    wasteEntries.forEach((entry) => {
      if (yPos > pageHeight - 20) {
        doc.addPage()
        yPos = 20
      }

      const addRow = (material, handler, type, total, diversion) => {
        if (rowCount % 2 === 0) {
          doc.setFillColor(248, 252, 247)
          doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 8, "F")
        }

        doc.text(material.substring(0, 20), colX[0], yPos + 4)
        doc.text((handler || "—").substring(0, 15), colX[1], yPos + 4)
        doc.text(type, colX[2], yPos + 4)
        doc.text(String(total), colX[3], yPos + 4)
        doc.text(diversion, colX[4], yPos + 4)

        yPos += 8
        rowCount++
      }

      if (entry.includeHazardous) {
        addRow(
          entry.wasteMaterial,
          entry.wasteHandler,
          "Hazardous",
          entry.hazardousData?.total || "—",
          `${entry.hazardousDiversionPercent || "0"}%`,
        )
      }

      if (entry.includeNonHazardous) {
        addRow(
          entry.wasteMaterial,
          entry.wasteHandler,
          "Non-Haz",
          entry.nonHazardousData?.total || "—",
          `${entry.nonHazardousDiversionPercent || "0"}%`,
        )
      }
    })

    const footerY = pageHeight - 15
    doc.setLineWidth(0.3)
    doc.setDrawColor(232, 240, 227)
    doc.line(margin, footerY, pageWidth - margin, footerY)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.setFont("helvetica", "normal")
    addText("ESG Compliance Report - Confidential", margin, footerY + 5)
    addText(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerY + 5, { align: "right" })

    return doc
  }

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true)

      if (!window.jspdf) {
        showToast("PDF library is still loading. Please try again in a moment.")
        setPdfLoading(false)
        return
      }

      const doc = await generatePDF()
      doc.save(`ESG-Compliance-Report-${reportingPeriod.year}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      showToast("Failed to generate PDF. Please try again.")
    } finally {
      setPdfLoading(false)
    }
  }

  const handlePreview = () => {
    setShowPreview(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className="dashboardContainer">
        <div style={{ maxWidth: '1600px', margin: '0 auto', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="spinner"></div>
            <p style={{ color: '#5a6c57' }}>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }


  // Error state
  if (error) {
    return (
      <div className="dashboardContainer">
        <div style={{ maxWidth: '1600px', margin: '0 auto', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <AlertCircle size={48} color="#e74c3c" />
            <p style={{ color: '#e74c3c', fontSize: '16px', fontWeight: 500 }}>{error}</p>
            <button onClick={fetchWasteEntries} className="downloadFullButton" style={{ background: 'linear-gradient(135deg, #194d2a 0%, #2d7a3e 100%)' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (wasteEntries.length === 0) {
    return (
      <div className="dashboardContainer">
        <div style={{ maxWidth: '1600px', margin: '4rem auto', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <Trash2 size={48} color="#95a5a6" />
            <p style={{ color: '#7f8c8d', fontSize: '16px' }}>
              No waste entries found. Please add waste data to view the dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboardContainer">
      <div style={{ maxWidth: '1500px', margin: '6rem auto', height: '80vh', overflow:'hidden', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>
        {/* Compact Header */}
        <div className="dashboardHeader" style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#194d2a', margin: 0 }}>Compliance Dashboard</h1>
                <p style={{ fontSize: '12px', color: '#5a6c57', margin: '2px 0 0 0' }}>
                  {reportingPeriod.periodType === "financial" ? "FY" : ""} {reportingPeriod.year}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  color: 'white',
                  background: `linear-gradient(135deg, ${badge.color} 0%, ${badge.color}dd 100%)`,
                }}
              >
                <span style={{ fontSize: '16px' }}>{badge.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{badge.name}</span>
              </div>
              <div onClick={handlePreview} className="actionButton" style={{ width: '32px', height: '32px' }}>
                <FileText size={16} />
              </div>
              <div
                className="actionButton"
                onClick={handleDownloadPDF}
                style={{ opacity: pdfLoading ? 0.7 : 1, width: '32px', height: '32px' }}
              >
                {pdfLoading ? <div className="buttonSpinner"></div> : <Download size={16} />}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Split into two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', flex: 1, minHeight: 0 }}>
          {/* Left Column - Circular Progress and Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Circular Progress */}
            <div className="chartCard" style={{ padding: '16px', flex: '0 0 auto' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#194d2a', margin: '0 0 8px 0' }}>Overall Diversion Rate</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <CircularProgress percentage={metrics.overallPercent} size={120} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <MetricBox label="Total" value={`${metrics.overallTotal.toFixed(0)} kg`} color="#194d2a" />
                <MetricBox label="Diverted" value={`${metrics.overallDiv.toFixed(0)} kg`} color="#27ae60" />
                <MetricBox label="Landfill" value={`${metrics.landfill.toFixed(0)} kg`} color="#e74c3c" />
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <StatCard
                icon={<Leaf size={16} color="#fff" />}
                label="Non-Haz Total"
                value={metrics.nonHazTotal.toFixed(0)}
                unit=" kg"
                color="#2d7a3e"
                gradient="linear-gradient(135deg, #2d7a3e 0%, #52a85f 100%)"
              />
              <StatCard
                icon={<Leaf size={16} color="#fff" />}
                label="Non-Haz Diverted"
                value={metrics.nonHazDiv.toFixed(0)}
                unit=" kg"
                color="#27ae60"
                gradient="linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)"
              />
              <StatCard
                icon={<AlertCircle size={16} color="#fff" />}
                label="Hazardous Total"
                value={metrics.hazTotal.toFixed(0)}
                unit=" kg"
                color="#c0392b"
                gradient="linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)"
              />
              <StatCard
                icon={<AlertCircle size={16} color="#fff" />}
                label="Hazardous Diverted"
                value={metrics.hazDiv.toFixed(0)}
                unit=" kg"
                color="#e67e22"
                gradient="linear-gradient(135deg, #e67e22 0%, #f39c12 100%)"
              />
            </div>
          </div>

          {/* Right Column - Charts and Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Diversion vs Landfill Pie Chart */}
              <div className="chartCard" style={{ padding: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#194d2a', margin: '0 0 8px 0' }}>Diversion vs Landfill</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={diversionVsLandfillData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {diversionVsLandfillData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Hazardous vs Non-Hazardous Bar Chart */}
              <div className="chartCard" style={{ padding: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#194d2a', margin: '0 0 8px 0' }}>Waste Type Distribution</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={hazardousVsNonHazardousData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {hazardousVsNonHazardousData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Waste Entries Table */}
            <div className="chartCard" style={{ padding: '12px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#194d2a', margin: '0 0 8px 0' }}>Waste Entries Summary</h3>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Handler</th>
                      <th>Type</th>
                      <th>Total (kg)</th>
                      <th>Diverted (kg)</th>
                      <th>Diversion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteEntries.map((entry) => (
                      <React.Fragment key={entry._id || entry.id}>
                        {entry.includeNonHazardous && (
                          <tr>
                            <td>{entry.wasteMaterial}</td>
                            <td>{entry.wasteHandler || "—"}</td>
                            <td>
                              <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 500, background: '#d4edda', color: '#155724' }}>Non-Haz</span>
                            </td>
                            <td>{entry.nonHazardousData?.total || 0}</td>
                            <td>{entry.nonHazardousDiversion || 0}</td>
                            <td>
                              <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#e9f5eb', color: '#194d2a' }}>{entry.nonHazardousDiversionPercent || 0}%</span>
                            </td>
                          </tr>
                        )}
                        {entry.includeHazardous && (
                          <tr>
                            <td>{entry.wasteMaterial}</td>
                            <td>{entry.wasteHandler || "—"}</td>
                            <td>
                              <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 500, background: '#f8d7da', color: '#721c24' }}>Hazardous</span>
                            </td>
                            <td>{entry.hazardousData?.total || 0}</td>
                            <td>{entry.hazardousDiversion || 0}</td>
                            <td>
                              <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#e9f5eb', color: '#194d2a' }}>{entry.hazardousDiversionPercent || 0}%</span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="modalOverlay" onClick={() => setShowPreview(false)}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#194d2a', margin: 0 }}>Report Preview</h2>
                <button className="closeButton" onClick={() => setShowPreview(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="previewContent" ref={previewRef}>
                <div style={{ textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, #194d2a 0%, #2d7a3e 100%)', borderRadius: '12px', color: 'white', marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>ESG Compliance Report</h1>
                  <p style={{ fontSize: '14px', opacity: 0.9, margin: '0 0 16px 0' }}>Zero Waste Performance Summary</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', opacity: 0.8 }}>
                    <span>Reporting Period: {reportingPeriod.periodType === "financial" ? "FY" : ""} {reportingPeriod.year}</span>
                    <span>Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 24px', borderRadius: '12px', color: 'white', marginBottom: '24px', backgroundColor: badge.color }}>
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>
                    {badge.icon} {badge.name}
                  </span>
                  <span style={{ fontSize: '14px', opacity: 0.9 }}>Overall Diversion Rate: {metrics.overallPercent.toFixed(1)}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', borderRadius: '10px', textAlign: 'center', background: '#e9f5eb' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: '#5a6c57', marginBottom: '8px' }}>Total Waste</span>
                    <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#194d2a' }}>{metrics.overallTotal.toFixed(1)} kg</strong>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '10px', textAlign: 'center', background: '#e9f5eb' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: '#5a6c57', marginBottom: '8px' }}>Diverted</span>
                    <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#27ae60' }}>{metrics.overallDiv.toFixed(1)} kg</strong>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '10px', textAlign: 'center', background: '#fef2f2' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: '#5a6c57', marginBottom: '8px' }}>Landfill</span>
                    <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#e74c3c' }}>{metrics.landfill.toFixed(1)} kg</strong>
                  </div>
                </div>
                {metrics.hazTotal > 0 && (
                  <div style={{ padding: '16px', borderRadius: '10px', marginBottom: '12px', background: '#f8d7da' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0', color: '#c0392b' }}>Hazardous Waste</h4>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#333' }}>
                      <span>Total: {metrics.hazTotal.toFixed(1)} kg</span>
                      <span>Diverted: {metrics.hazDiv.toFixed(1)} kg ({metrics.hazPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                )}
                {metrics.nonHazTotal > 0 && (
                  <div style={{ padding: '16px', borderRadius: '10px', marginBottom: '12px', background: '#d4edda' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0', color: '#2d7a3e' }}>Non-Hazardous Waste</h4>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#333' }}>
                      <span>Total: {metrics.nonHazTotal.toFixed(1)} kg</span>
                      <span>Diverted: {metrics.nonHazDiv.toFixed(1)} kg ({metrics.nonHazPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modalFooter">
                <button className="downloadFullButton" onClick={handleDownloadPDF}>
                  <Download size={16} />
                  <span style={{ marginLeft: '8px' }}>Download Full PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboardContainer {
          height: 100vh;
          // background: linear-gradient(180deg, #f8fcf7 0%, #e8f0e3 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
          overflow: hidden;
        }

        .dashboardHeader {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(25, 77, 42, 0.08);
        }

        .actionButton {
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid #e8f0e3;
          border-radius: 8px;
          cursor: pointer;
          color: #194d2a;
          transition: all 0.2s;
        }

        .actionButton:hover {
          background: #e9f5eb;
          border-color: #194d2a;
        }

        .statCard {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(25, 77, 42, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .statCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(25, 77, 42, 0.12);
        }

        .chartCard {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(25, 77, 42, 0.08);
        }

        .dataTable {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .dataTable th {
          background: #194d2a;
          color: white;
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .dataTable th:first-child {
          border-radius: 6px 0 0 0;
        }

        .dataTable th:last-child {
          border-radius: 0 6px 0 0;
        }

        .dataTable td {
          padding: 8px 12px;
          border-bottom: 1px solid #e8f0e3;
        }

        .dataTable tr:nth-child(even) {
          background: #f8fcf7;
        }

        .dataTable tr:hover {
          background: #e9f5eb;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
          backdrop-filter: blur(4px);
        }

        .modalContent {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
        }

        .modalHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e8f0e3;
          background: #f8fcf7;
        }

        .closeButton {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: #5a6c57;
          transition: background 0.2s;
        }

        .closeButton:hover {
          background: #e8f0e3;
        }

        .previewContent {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .modalFooter {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e8f0e3;
          background: #f8fcf7;
        }

        .downloadFullButton {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #194d2a 0%, #2d7a3e 100%);
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .downloadFullButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 77, 42, 0.3);
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e8f0e3;
          border-top: 4px solid #194d2a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .buttonSpinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          background: #333;
          color: white;
          border-radius: 8px;
          font-size: 14px;
          z-index: 2000;
          animation: slideUp 0.3s ease-out;
        }

        .toastInfo {
          background: #194d2a;
        }

        .toastError {
          background: #e74c3c;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .dashboardContainer {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}
export default ComplianceDashboard;
// Wrap export with ToastProvider
// export default function App() {
//   return (
//     <ToastProvider>
//       <ComplianceDashboard />
//     </ToastProvider>
//   )
// }