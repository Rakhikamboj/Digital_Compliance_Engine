import React, { useState, useEffect, useRef } from "react"
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
import styles from "../styles/Dashboard.module.css"
import { Leaf, Trash2, AlertCircle, Download, FileText, X } from "lucide-react"
import { useToast } from "../context/ToastContext"
const API_URL = import.meta.env.VITE_API_KEY + "/api/waste-entries"

// Circular Progress Component
const CircularProgress = ({ percentage, size = 160, primaryColor = "#194d2a" }) => {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={styles.circularProgressContainer} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.circularProgressSvg}>
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
          className={styles.circularProgressCircleTransition}
        />
      </svg>
      <div className={styles.circularProgressContent}>
        <div className={styles.circularProgressPercentage} style={{ color: primaryColor }}>
          {percentage.toFixed(1)}%
        </div>
        <div className={styles.circularProgressLabel}>DIVERTED</div>
      </div>
    </div>
  )
}

//
const ComplianceDashboard = ({ projectSelected, reportingPeriod = { periodType: "financial", year: "2024-25" } }) => {
  const [wasteEntries, setWasteEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const previewRef = useRef(null)
      const { showToast } = useToast();

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
  }, [projectSelected, reportingPeriod])

  // Load jsPDF library
  useEffect(() => {
    if (!window.jspdf) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
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
        params.append("reportingPeriod", reportingPeriod)
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
        hazTotal += Number.parseFloat(entry.hazardousData.total) || 0
        hazDiv += Number.parseFloat(entry.hazardousDiversion) || 0
        hazExemption += Number.parseFloat(entry.hazardousData.exemptionCategory) || 0
      }
      if (entry.includeNonHazardous) {
        nonHazTotal += Number.parseFloat(entry.nonHazardousData.total) || 0
        nonHazDiv += Number.parseFloat(entry.nonHazardousDiversion) || 0
        nonHazExemption += Number.parseFloat(entry.nonHazardousData.exemptionCategory) || 0
      }
    })

    const totalExemption = hazExemption + nonHazExemption
    const overallTotal = hazTotal + nonHazTotal
    const overallDiv = hazDiv + nonHazDiv

    const denominator = overallTotal - totalExemption
    const overallPercent = denominator > 0 ? (overallDiv / denominator) * 100 : 0

    // Hazardous diversion percentage
    const hazDenominator = hazTotal - hazExemption
    const hazPercent = hazDenominator > 0 ? (hazDiv / hazDenominator) * 100 : 0

    // Non-hazardous diversion percentage
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
      landfill,
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

    // Helper function to add text with line breaks
    const addText = (text, x, y, options = {}) => {
      doc.text(text, x, y, options)
    }

    // Header with company branding
    doc.setFillColor(25, 77, 42) // #194d2a
    doc.rect(0, 0, pageWidth, 40, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    addText("ESG Compliance Report", margin, 20)

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    addText(`Zero Waste Performance Summary`, margin, 30)

    yPos = 50

    // Report Period
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

    // Leadership Badge Section
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

    // Key Metrics Section
    doc.setTextColor(25, 77, 42)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    addText("Key Performance Metrics", margin, yPos)
    yPos += 10

    // Metrics boxes
    const boxWidth = (pageWidth - 2 * margin - 10) / 3
    const boxHeight = 25

    // Total Waste
    doc.setFillColor(233, 245, 235)
    doc.roundedRect(margin, yPos, boxWidth, boxHeight, 2, 2, "F")
    doc.setTextColor(25, 77, 42)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    addText("Total Waste Generated", margin + boxWidth / 2, yPos + 8, { align: "center" })
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    addText(`${metrics.overallTotal.toFixed(1)} kg`, margin + boxWidth / 2, yPos + 18, { align: "center" })

    // Diverted
    doc.setFillColor(233, 245, 235)
    doc.roundedRect(margin + boxWidth + 5, yPos, boxWidth, boxHeight, 2, 2, "F")
    doc.setTextColor(39, 174, 96)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    addText("Waste Diverted", margin + boxWidth + 5 + boxWidth / 2, yPos + 8, { align: "center" })
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    addText(`${metrics.overallDiv.toFixed(1)} kg`, margin + boxWidth + 5 + boxWidth / 2, yPos + 18, { align: "center" })

    // Landfill
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

    // Waste Type Breakdown
    doc.setTextColor(25, 77, 42)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    addText("Waste Type Analysis", margin, yPos)
    yPos += 8

    // Hazardous Waste
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

    // Non-Hazardous Waste
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

    // Waste Entries Table
    if (yPos > pageHeight - 80) {
      doc.addPage()
      yPos = 20
    }

    doc.setTextColor(25, 77, 42)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    addText("Waste Entries Summary", margin, yPos)

    yPos += 8

    // Table headers
    doc.setFillColor(25, 77, 42)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")

    // const colWidths = [50, 35, 30, 30, 25];
    const colX = [margin + 2, margin + 52, margin + 87, margin + 117, margin + 147]

    addText("Material", colX[0], yPos + 6)
    addText("Handler", colX[1], yPos + 6)
    addText("Type", colX[2], yPos + 6)
    addText("Total (kg)", colX[3], yPos + 6)
    addText("Diversion", colX[4], yPos + 6)

    yPos += 10

    // Table rows
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
        doc.text(total, colX[3], yPos + 4)
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

    // Footer
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
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardContent}>
          <div className={styles.loadingContainer}>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardContent}>
          <div className={styles.errorContainer}>
            <p style={{ color: "#e74c3c" }}>{error}</p>
            <button onClick={fetchWasteEntries} className={styles.retryButton}>
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
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardContent}>
          <div className={styles.noDataContainer}>
            <Trash2 size={48} color="#95a5a6" />
            <p style={{ color: "#7f8c8d", marginTop: "16px" }}>
              No waste entries found. Please add waste data to view the dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        <div className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div>
                
                <h1 className={styles.headerTitle}>Compliance Dashboard</h1>
                <p className={styles.headerSubtitle}>
                  {reportingPeriod.periodType === "financial" ? "FY" : ""} {reportingPeriod.year}
                </p>
              </div>
            </div>
            <div className={styles.headerRight}>
              <div
                className={styles.badgeContainer}
                style={{
                  background: `linear-gradient(135deg, ${badge.color} 0%, ${badge.color}dd 100%)`,
                }}
              >
                <span className={styles.badgeIcon}>{badge.icon}</span>
                <span className={styles.badgeText}>{badge.name}</span>
              </div>
              <div className={styles.headerLeft}>
                <div onClick={handlePreview} className={styles.previewButton} style={{}}>
                  <FileText size={18} />
                </div>
              </div>

              <div
                className={styles.download}
                onClick={handleDownloadPDF}
                style={{ cursor: pdfLoading ? "not-allowed" : "pointer", opacity: pdfLoading ? 0.6 : 1 }}
                title={pdfLoading ? "Generating PDF..." : "Download PDF Report"}
              >
                {pdfLoading ? <div style={{ fontSize: "12px" }}>...</div> : <Download size={18} />}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            icon={<Trash2 size={20} />}
            label="Total Waste"
            value={metrics.overallTotal.toFixed(1)}
            unit="kg"
            color="#194d2a"
            gradient="linear-gradient(135deg, #194d2a 0%, #2d7a3e 100%)"
          />
          <StatCard
            icon={<Leaf size={20} />}
            label="Diverted"
            value={metrics.overallDiv.toFixed(1)}
            unit="kg"
            color="#27ae60"
            gradient="linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)"
          />
          <StatCard
            icon={<AlertCircle size={20} />}
            label="Landfill"
            value={metrics.landfill.toFixed(1)}
            unit="kg"
            color="#e74c3c"
            gradient="linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)"
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCardCentered}>
            <h3 className={styles.chartTitle}>Zero Waste Achievement</h3>

            <CircularProgress percentage={metrics.overallPercent} size={160} primaryColor="#194d2a" />

            <div className={styles.metricsGrid}>
              <MetricBox label="Hazardous" value={`${metrics.hazPercent.toFixed(1)}%`} color="#c0392b" />
              <MetricBox label="Non-Hazardous" value={`${metrics.nonHazPercent.toFixed(1)}%`} color="#2d7a3e" />
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Diverted vs Landfill</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={diversionVsLandfillData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#5a6c57", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a6c57", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fefffa",
                    border: "1px solid #e8f0e3",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                  {diversionVsLandfillData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCardFull}>
          <h3 className={styles.chartTitleCentered}>Waste Composition</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={hazardousVsNonHazardousData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name}: ${value.toFixed(1)}kg (${(percent * 100).toFixed(1)}%)`}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
              >
                {hazardousVsNonHazardousData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#fefffa",
                  border: "1px solid #e8f0e3",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "13px", color: "#5a6c57" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <div className={styles.modalOverlay} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <FileText size={24} color="#194d2a" />
                <h2>ESG Compliance Report Preview</h2>
              </div>
              <button className={styles.closeButton} onClick={() => setShowPreview(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.previewContent} ref={previewRef}>
              {/* Report Header */}
              <div className={styles.reportHeader}>
                <h1>ESG Compliance Report</h1>
                <p className={styles.reportSubtitle}>Zero Waste Performance Summary</p>
                <div className={styles.reportMeta}>
                  <span>
                    Reporting Period: {reportingPeriod.periodType === "financial" ? "FY" : ""} {reportingPeriod.year}
                  </span>
                  <span>
                    Generated:{" "}
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Leadership Badge */}
              <div
                className={styles.previewBadge}
                style={{ background: `linear-gradient(135deg, ${badge.color} 0%, ${badge.color}dd 100%)` }}
              >
                <span className={styles.previewBadgeIcon}>{badge.icon}</span>
                <div>
                  <h3>{badge.name}</h3>
                  <p>Overall Diversion Rate: {metrics.overallPercent.toFixed(1)}%</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className={styles.previewSection}>
                <h3>Key Performance Metrics</h3>
                <div className={styles.previewMetrics}>
                  <div className={styles.previewMetricBox} style={{ background: "#e9f5eb" }}>
                    <span className={styles.previewMetricLabel}>Total Waste Generated</span>
                    <span className={styles.previewMetricValue} style={{ color: "#194d2a" }}>
                      {metrics.overallTotal.toFixed(1)} kg
                    </span>
                  </div>
                  <div className={styles.previewMetricBox} style={{ background: "#e9f5eb" }}>
                    <span className={styles.previewMetricLabel}>Waste Diverted</span>
                    <span className={styles.previewMetricValue} style={{ color: "#27ae60" }}>
                      {metrics.overallDiv.toFixed(1)} kg
                    </span>
                  </div>
                  <div className={styles.previewMetricBox} style={{ background: "#fef2f2" }}>
                    <span className={styles.previewMetricLabel}>Sent to Landfill</span>
                    <span className={styles.previewMetricValue} style={{ color: "#e74c3c" }}>
                      {metrics.landfill.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Waste Type Analysis */}
              <div className={styles.previewSection}>
                <h3>Waste Type Analysis</h3>
                {metrics.hazTotal > 0 && (
                  <div
                    className={styles.previewWasteType}
                    style={{ background: "#f8d7da", borderLeft: "4px solid #c0392b" }}
                  >
                    <h4 style={{ color: "#c0392b" }}>Hazardous Waste</h4>
                    <div className={styles.previewWasteTypeData}>
                      <span>Total: {metrics.hazTotal.toFixed(1)} kg</span>
                      <span>
                        Diverted: {metrics.hazDiv.toFixed(1)} kg ({metrics.hazPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
                {metrics.nonHazTotal > 0 && (
                  <div
                    className={styles.previewWasteType}
                    style={{ background: "#d4edda", borderLeft: "4px solid #2d7a3e" }}
                  >
                    <h4 style={{ color: "#2d7a3e" }}>Non-Hazardous Waste</h4>
                    <div className={styles.previewWasteTypeData}>
                      <span>Total: {metrics.nonHazTotal.toFixed(1)} kg</span>
                      <span>
                        Diverted: {metrics.nonHazDiv.toFixed(1)} kg ({metrics.nonHazPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Diverted vs Landfill Chart */}
              <div className={styles.previewSection}>
                <h3>Diversion Performance</h3>
                <div className={styles.previewChart}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={diversionVsLandfillData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#5a6c57", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis tick={{ fill: "#5a6c57", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#fefffa",
                          border: "1px solid #e8f0e3",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={100}>
                        {diversionVsLandfillData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Waste Entries Table */}
              <div className={styles.previewSection}>
                <h3>Waste Entries Summary</h3>
                <div className={styles.previewTableWrapper}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Handler</th>
                        <th>Type</th>
                        <th>Total (kg)</th>
                        <th>Diversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wasteEntries.map((entry) => (
                        <React.Fragment key={entry._id}>
                          {entry.includeHazardous && (
                            <tr>
                              <td>{entry.wasteMaterial}</td>
                              <td>{entry.wasteHandler || "—"}</td>
                              <td>Hazardous</td>
                              <td>{entry.hazardousData?.total || "—"}</td>
                              <td>{entry.hazardousDiversionPercent || "0"}%</td>
                            </tr>
                          )}
                          {entry.includeNonHazardous && (
                            <tr>
                              <td>{entry.wasteMaterial}</td>
                              <td>{entry.wasteHandler || "—"}</td>
                              <td>Non-Hazardous</td>
                              <td>{entry.nonHazardousData?.total || "—"}</td>
                              <td>{entry.nonHazardousDiversionPercent || "0"}%</td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Note */}
              <div className={styles.previewFooter}>
                <p>This report is confidential and intended for internal ESG compliance purposes.</p>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setShowPreview(false)}>
                Cancel
              </button>
              <button className={styles.downloadButton} onClick={handleDownloadPDF} disabled={pdfLoading}>
                <Download size={18} />
                {pdfLoading ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ icon, label, value, unit, color, gradient }) => (
  <div className={styles.statCard}>
    <div className={styles.statCardHeader}>
      <div className={styles.statCardIcon} style={{ background: gradient }}>
        {icon}
      </div>
      <div className={styles.statCardLabel}>{label}</div>
    </div>
    <div className={styles.statCardValue} style={{ color: color }}>
      {value}
      <span className={styles.statCardUnit}>{unit}</span>
    </div>
  </div>
)

const MetricBox = ({ label, value, color }) => (
  <div className={styles.metricBox}>
    <div className={styles.metricBoxLabel}>{label}</div>
    <div className={styles.metricBoxValue} style={{ color: color }}>
      {value}
    </div>
  </div>
)

export default ComplianceDashboard
