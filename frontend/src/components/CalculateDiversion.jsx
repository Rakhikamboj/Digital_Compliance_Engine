import { useState, useEffect, useRef } from "react";
import { Plus, BarChart3, Download, Info, X } from "lucide-react";
import styles from "../styles/WasteDataEntry.module.css";
import ComplianceDashboard from "../pages/Dashboard";
import WasteEntrySidebar from "./WasteEntrySidebar";
import { useToast } from "../common/ToastContext";

const API_URL = import.meta.env.VITE_API_KEY;

const WasteDataEntry = ({ projectInfo, onBackToProjects }) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [wasteEntries, setWasteEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState("");
  const { showToast } = useToast();
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [showCopyIndicator, setShowCopyIndicator] = useState(false);
  const tableRef = useRef(null);

  // New entry row state
  const [newRow, setNewRow] = useState({
    wasteMaterial: "",
    wasteHandler: "",
    modeOfDisposal: "",
    inputDate: new Date().toISOString().split("T")[0],
    type: "hazardous",
    unit: "kg",
    total: "",
    reuse: "",
    recycle: "",
    composting: "",
    incinerationWithHeat: "",
    incinerationWithoutHeat: "",
    landfill: "",
    exemption: "",
  });

  // Helper functions
  const getAuthToken = () => localStorage.getItem("token");
  
  const getUserIdFromToken = () => {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const getReportingPeriodRange = (reportingPeriod) => {
    if (!reportingPeriod?.periodType || !reportingPeriod?.year) return null;

    const { periodType, year } = reportingPeriod;
    const yearNum = parseInt(year, 10);
    
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) return null;

    const normalizedPeriodType = periodType === "financial" ? "FY" : periodType;
    let startDate, endDate;

    if (normalizedPeriodType === "FY") {
      startDate = new Date(yearNum, 3, 1);
      endDate = new Date(yearNum + 1, 2, 31);
    } else if (normalizedPeriodType === "CY") {
      startDate = new Date(yearNum, 0, 1);
      endDate = new Date(yearNum, 11, 31);
    } else {
      return null;
    }

    return { startDate, endDate };
  };

  // Fetch entries
  useEffect(() => {
    fetchWasteEntries();
  }, [projectInfo?._id]);

  // Initialize expanded months
  useEffect(() => {
    const grouped = groupByMonth(gridData);
    const initialExpanded = {};
    Object.keys(grouped).forEach(key => {
      initialExpanded[key] = true;
    });
    setExpandedMonths(initialExpanded);
  }, [wasteEntries]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+C or Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCell) {
        e.preventDefault();
        handleCopy();
      }
      
      // Ctrl+V or Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selectedCell) {
        e.preventDefault();
        handlePaste();
      }

      // Tab - Move to next cell
      if (e.key === 'Tab' && editingCell) {
        e.preventDefault();
        moveToNextCell();
      }

      // Enter - Confirm edit or start editing
      if (e.key === 'Enter' && !e.shiftKey) {
        if (editingCell) {
          setEditingCell(null);
        } else if (selectedCell) {
          setEditingCell(selectedCell);
        }
      }

      // Escape - Cancel edit
      if (e.key === 'Escape') {
        setEditingCell(null);
        setSelectedCell(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell]);

  const fetchWasteEntries = async () => {
    try {
      setFetchLoading(true);
      const token = getAuthToken();
      const userId = getUserIdFromToken();
      const projectId = projectInfo?._id;

      if (!token || !userId) {
        showToast("Please log in to view waste entries", "error");
        return;
      }

      const params = new URLSearchParams();
      params.append("userId", userId);
      if (projectId) params.append("projectId", projectId);

      const response = await fetch(
        `${API_URL}/api/waste-entries?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = await response.json();
      if (response.ok) {
        setWasteEntries(result.data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Failed to fetch waste entries", "error");
    } finally {
      setFetchLoading(false);
    }
  };

  // Transform entries for grid display
  const gridData = wasteEntries.map((entry) => {
    const data = entry.includeHazardous ? entry.hazardousData : entry.nonHazardousData;
    // Format date to YYYY-MM-DD only
    const dateObj = new Date(entry.inputDate);
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    return {
      _id: entry._id,
      wasteMaterial: entry.wasteMaterial,
      wasteHandler: entry.wasteHandler || "",
      modeOfDisposal: entry.modeOfDisposal || "",
      inputDate: formattedDate,
      type: entry.includeHazardous ? "hazardous" : "nonHazardous",
      unit: entry.unit,
      total: data?.total || "",
      reuse: data?.reuse || "",
      recycle: data?.recycle || "",
      composting: data?.composting || "",
      incinerationWithHeat: data?.incinerationWithHeat || "",
      incinerationWithoutHeat: data?.incinerationWithoutHeat || "",
      landfill: data?.landfill || "",
      exemption: data?.exemption || "",
    };
  });

  // Group by month
  const groupByMonth = (entries) => {
    const grouped = {};
    entries.forEach((entry) => {
      const date = new Date(entry.inputDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(entry);
    });
    return grouped;
  };

  const groupedData = groupByMonth(gridData);
  const sortedMonths = Object.keys(groupedData).sort().reverse();

  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Copy/Paste functionality
  const handleCopy = () => {
    if (!selectedCell) return;
    
    const { rowId, field } = selectedCell;
    const entry = gridData.find(e => e._id === rowId);
    if (entry && entry[field] !== undefined) {
      navigator.clipboard.writeText(String(entry[field]));
      setShowCopyIndicator(true);
      setTimeout(() => setShowCopyIndicator(false), 2000);
      showToast("Copied to clipboard", "success");
    }
  };

  const handlePaste = async () => {
    if (!selectedCell) return;
    
    try {
      const text = await navigator.clipboard.readText();
      const { rowId, field } = selectedCell;
      handleCellEdit(rowId, field, text);
      showToast("Pasted from clipboard", "success");
    } catch (err) {
      console.error("Paste error:", err);
    }
  };

  const moveToNextCell = () => {
    // Logic to move to next editable cell
    setEditingCell(null);
  };

  // Add new entry
  const handleAddRow = async () => {
    if (!newRow.wasteMaterial || !newRow.total) {
      showToast("Please fill in waste material and total amount", "error");
      return;
    }

    setLoading(true);
    const token = getAuthToken();
    const userId = getUserIdFromToken();
    const projectId = projectInfo?._id;

    const reportingPeriod = {
      ...projectInfo?.reportingPeriod,
      periodType: projectInfo?.reportingPeriod?.periodType === "financial" 
        ? "FY" 
        : projectInfo?.reportingPeriod?.periodType,
    };

    const disposalData = {
      total: newRow.total,
      reuse: newRow.reuse,
      recycle: newRow.recycle,
      composting: newRow.composting,
      incinerationWithHeat: newRow.incinerationWithHeat,
      incinerationWithoutHeat: newRow.incinerationWithoutHeat,
      landfill: newRow.landfill,
      exemption: newRow.exemption,
    };

    const newEntry = {
      userId,
      projectId,
      reportingPeriod,
      wasteMaterial: newRow.wasteMaterial,
      wasteHandler: newRow.wasteHandler || null,
      modeOfDisposal: newRow.modeOfDisposal || null,
      inputDate: newRow.inputDate,
      unit: newRow.unit,
      includeHazardous: newRow.type === "hazardous",
      includeNonHazardous: newRow.type === "nonHazardous",
      hazardousData: newRow.type === "hazardous" ? disposalData : null,
      nonHazardousData: newRow.type === "nonHazardous" ? disposalData : null,
    };

    try {
      const response = await fetch(`${API_URL}/api/waste-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEntry),
      });

      const result = await response.json();
      
      if (response.ok) {
        setWasteEntries((prev) => [...prev, result.data]);
        showToast("Entry added successfully", "success");
        
        // Reset new row
        setNewRow({
          wasteMaterial: "",
          wasteHandler: "",
          modeOfDisposal: "",
          inputDate: new Date().toISOString().split("T")[0],
          type: "hazardous",
          unit: "kg",
          total: "",
          reuse: "",
          recycle: "",
          composting: "",
          incinerationWithHeat: "",
          incinerationWithoutHeat: "",
          landfill: "",
          exemption: "",
        });
      } else {
        showToast(result.message || "Failed to add entry", "error");
      }
    } catch  {
      showToast("Failed to add entry", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}/api/waste-entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setWasteEntries((prev) => prev.filter((e) => e._id !== id));
        showToast("Entry deleted successfully", "success");
      }
    } catch  {
      showToast("Failed to delete entry", "error");
    }
  };

  // Cell editing
  const handleCellEdit = (rowId, field, value) => {
    const updatedEntries = wasteEntries.map(entry => {
      if (entry._id === rowId) {
        if (['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 'incinerationWithoutHeat', 'landfill', 'exemption'].includes(field)) {
          const dataKey = entry.includeHazardous ? 'hazardousData' : 'nonHazardousData';
          return {
            ...entry,
            [dataKey]: {
              ...entry[dataKey],
              [field]: value
            }
          };
        }
        return { ...entry, [field]: value };
      }
      return entry;
    });
    
    setWasteEntries(updatedEntries);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = [
      "Material", "Handler", "Disposal Mode", "Date", "Type", "Unit",
      "Total", "Reuse", "Recycle", "Composting", "Incineration (Heat)",
      "Incineration (No Heat)", "Landfill", "Exemption"
    ];

    const rows = gridData.map(entry => [
      entry.wasteMaterial,
      entry.wasteHandler,
      entry.modeOfDisposal,
      entry.inputDate,
      entry.type === "hazardous" ? "Hazardous" : "Non-Hazardous",
      entry.unit,
      entry.total,
      entry.reuse,
      entry.recycle,
      entry.composting,
      entry.incinerationWithHeat,
      entry.incinerationWithoutHeat,
      entry.landfill,
      entry.exemption,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `waste_entries_${projectInfo?.projectName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod);

  if (showDashboard) {
    return (
      <div className={styles.dashboardContainer}>
        <button onClick={() => setShowDashboard(false)} className={styles.backButton}>
          ← Back to Waste Entry
        </button>
        <ComplianceDashboard
          projectSelected={projectInfo}
          reportingPeriod={projectInfo?.reportingPeriod}
        />
      </div>
    );
  }

  return (
    <div className={styles.containerWithSidebar}>
      <WasteEntrySidebar
        projectInfo={projectInfo}
        wasteEntries={wasteEntries}
        fetchLoading={fetchLoading}
        onBackToProjects={onBackToProjects}
        onDeleteEntry={handleDeleteEntry}
        onSubmitEntries={() => {}}
      />

      <div className={styles.mainContent}>
        <div className={styles.excelGridContainer}>
          {/* Toolbar */}
          <div className={styles.excelToolbar}>
            <div className={styles.toolbarLeft}>
              <h2 className={styles.excelTitle}>Waste Entry Spreadsheet</h2>
              <span className={styles.entryCount}>{gridData.length} entries</span>
            </div>
            <div className={styles.toolbarRight}>
              <button className={styles.toolbarBtn} onClick={handleExport}>
                <Download size={16} />
                Export
              </button>
              <button className={styles.toolbarBtn} onClick={() => setShowDashboard(true)}>
                <BarChart3 size={16} />
                Dashboard
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className={styles.infoBanner}>
            <Info size={16} />
            <span>Using the grid. The grid below allows full copy and paste from Excel.</span>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          {/* Excel-like Grid */}
          <div className={styles.excelTableWrapper} ref={tableRef}>
            <table className={styles.excelTable}>
              <thead className={styles.excelTableHead}>
                <tr>
                  <th className={styles.excelTh}>Material</th>
                  <th className={styles.excelTh}>Handler</th>
                  <th className={styles.excelTh}>Disposal Mode</th>
                  <th className={styles.excelTh}>Date</th>
                  <th className={styles.excelTh}>Type</th>
                  <th className={styles.excelTh}>Unit</th>
                  <th className={styles.excelTh}>Total</th>
                  <th className={styles.excelTh}>Reuse</th>
                  <th className={styles.excelTh}>Recycle</th>
                  <th className={styles.excelTh}>Composting</th>
                  <th className={styles.excelTh}>Incin. (Heat)</th>
                  <th className={styles.excelTh}>Incin. (No Heat)</th>
                  <th className={styles.excelTh}>Landfill</th>
                  <th className={styles.excelTh}>Exemption</th>
                  <th className={styles.excelTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* New Entry Row */}
                <tr className={styles.newEntryRow}>
                  <td className={styles.excelTd}>
                    <input
                      type="text"
                      className={styles.excelInput}
                      placeholder="Enter material..."
                      value={newRow.wasteMaterial}
                      onChange={(e) => setNewRow({...newRow, wasteMaterial: e.target.value})}
                    />
                  </td>
                  <td className={styles.excelTd}>
                    <input
                      type="text"
                      className={styles.excelInput}
                      placeholder="Handler..."
                      value={newRow.wasteHandler}
                      onChange={(e) => setNewRow({...newRow, wasteHandler: e.target.value})}
                    />
                  </td>
                  <td className={styles.excelTd}>
                    <input
                      type="text"
                      className={styles.excelInput}
                      placeholder="Disposal..."
                      value={newRow.modeOfDisposal}
                      onChange={(e) => setNewRow({...newRow, modeOfDisposal: e.target.value})}
                    />
                  </td>
                  <td className={styles.excelTd}>
                    <input
                      type="date"
                      className={styles.excelInput}
                      value={newRow.inputDate}
                      min={dateRange?.startDate?.toISOString().split("T")[0]}
                      max={dateRange?.endDate?.toISOString().split("T")[0]}
                      onChange={(e) => setNewRow({...newRow, inputDate: e.target.value})}
                    />
                  </td>
                  <td className={styles.excelTd}>
                    <select
                      className={styles.excelSelect}
                      value={newRow.type}
                      onChange={(e) => setNewRow({...newRow, type: e.target.value})}
                    >
                      <option value="hazardous">Hazardous</option>
                      <option value="nonHazardous">Non-Hazardous</option>
                    </select>
                  </td>
                  <td className={styles.excelTd}>
                    <select
                      className={styles.excelSelect}
                      value={newRow.unit}
                      onChange={(e) => setNewRow({...newRow, unit: e.target.value})}
                    >
                      <option value="kg">kg</option>
                      <option value="tonnes">Tonnes</option>
                      <option value="metric_tonnes">MT</option>
                    </select>
                  </td>
                  {['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 'incinerationWithoutHeat', 'landfill', 'exemption'].map(field => (
                    <td key={field} className={styles.excelTd}>
                      <input
                        type="number"
                        className={styles.excelInput}
                        placeholder="0.00"
                        value={newRow[field]}
                        onChange={(e) => setNewRow({...newRow, [field]: e.target.value})}
                      />
                    </td>
                  ))}
                  <td className={styles.excelTd}>
                    <button
                      className={styles.addRowBtn}
                      onClick={handleAddRow}
                      disabled={loading}
                      title="Add Entry (Ctrl+Enter)"
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>

                {/* Existing Entries Grouped by Month */}
                {sortedMonths.length === 0 ? (
                  <tr>
                    <td colSpan="15" className={styles.emptyState}>
                      No entries yet. Add your first entry above.
                    </td>
                  </tr>
                ) : (
                  sortedMonths.map((monthKey) => (
                    <>
                      <tr key={monthKey} className={`${styles.monthGroupRow} ${!expandedMonths[monthKey] ? styles.collapsed : ''}`} onClick={() => toggleMonth(monthKey)}>
                        <td colSpan="15" className={styles.monthGroupCell}>
                          {formatMonth(monthKey)} ({groupedData[monthKey].length} entries)
                        </td>
                      </tr>
                      {expandedMonths[monthKey] && groupedData[monthKey].map((entry) => (
                        <tr key={entry._id} className={styles.excelDataRow}>
                          <td className={styles.excelTd} onClick={() => setSelectedCell({ rowId: entry._id, field: 'wasteMaterial' })}>
                            <div className={styles.cellDisplay}>{entry.wasteMaterial}</div>
                          </td>
                          <td className={styles.excelTd} onClick={() => setSelectedCell({ rowId: entry._id, field: 'wasteHandler' })}>
                            <div className={styles.cellDisplay}>{entry.wasteHandler || "-"}</div>
                          </td>
                          <td className={styles.excelTd} onClick={() => setSelectedCell({ rowId: entry._id, field: 'modeOfDisposal' })}>
                            <div className={styles.cellDisplay}>{entry.modeOfDisposal || "-"}</div>
                          </td>
                          <td className={styles.excelTd} onClick={() => setSelectedCell({ rowId: entry._id, field: 'inputDate' })}>
                            <div className={styles.cellDisplay}>{entry.inputDate}</div>
                          </td>
                          <td className={styles.excelTd}>
                            <span className={entry.type === "hazardous" ? styles.hazBadge : styles.nonHazBadge}>
                              {entry.type === "hazardous" ? "Hazardous" : "Non-Hazardous"}
                            </span>
                          </td>
                          <td className={styles.excelTd} onClick={() => setSelectedCell({ rowId: entry._id, field: 'unit' })}>
                            <div className={styles.cellDisplay}>{entry.unit}</div>
                          </td>
                          {['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 'incinerationWithoutHeat', 'landfill', 'exemption'].map(field => (
                            <td key={field} className={styles.excelTd} onClick={() => setSelectedCell({ rowId: entry._id, field })}>
                              <div className={styles.cellDisplay}>{entry[field] || "-"}</div>
                            </td>
                          ))}
                          <td className={styles.excelTd}>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteEntry(entry._id)}
                              title="Delete Entry"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Copy Indicator */}
          {showCopyIndicator && (
            <div className={styles.copyIndicator}>
              ✓ Copied to clipboard
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WasteDataEntry;