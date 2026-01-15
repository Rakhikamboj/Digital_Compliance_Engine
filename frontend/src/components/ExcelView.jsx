import { useState, useEffect, useRef } from "react";
import { Plus, Download, BarChart3, X, ChevronDown, ArrowUp, ArrowDown, Filter, Check, ChevronLeft } from "lucide-react";
import ComplianceDashboard from "../pages/Dashboard";
import { useToast } from "../context/ToastContext"
// Mock API URL - Replace with your actual API
const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:5000";

// Waste Material Options
const WASTE_MATERIALS = [
  "Paper", "Plastic", "Metal", "Electronics", "Medical Waste",
  "Sludges", "Ash", "Waste Water", "Agriculture Waste", "Glass",
  "Textile", "Construction Waste", "Chemical Waste", "Biological Waste", "Others"
];

// Disposal Mode Options
const DISPOSAL_MODES = [
  "Recycling", "Composting", "Reuse", "Landfill",
  "Incineration with Heat Recovery", "Incineration without Heat Recovery",
  "Treatment", "Others"
];

// Toast notification helper
const showToast = (message, type = "info") => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

// Column Header with Filter/Sort Dropdown
const ColumnHeader = ({ 
  label, 
  field, 
  sortConfig, 
  onSort, 
  filterConfig, 
  onFilter,
  filterType = "text",
  options = [],
  enableSort = true,
  enableFilter = true
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilter = filterConfig[field] && 
    (Array.isArray(filterConfig[field]) ? filterConfig[field].length > 0 : filterConfig[field] !== "");

  const isSorted = sortConfig.field === field;

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!enableSort && !enableFilter) {
    return (
      <th style={styles.th}>
        <div style={styles.headerContent}>
          <span style={styles.headerLabel}>{label}</span>
        </div>
      </th>
    );
  }

  return (
    <th style={styles.th}>
      <div style={styles.headerContent}>
        <span style={styles.headerLabel}>{label}</span>
        <button 
          style={{
            ...styles.headerButton,
            ...(hasActiveFilter || isSorted ? styles.headerButtonActive : {})
          }}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {showDropdown && (
        <div ref={dropdownRef} style={styles.dropdown}>
          {enableSort && (
            <>
              <div style={styles.dropdownSection}>
                <div style={styles.sectionTitle}>Sort</div>
                <button
                  style={{
                    ...styles.dropdownItem,
                    ...(isSorted && sortConfig.direction === "asc" ? styles.dropdownItemActive : {})
                  }}
                  onClick={() => {
                    onSort(field, "asc");
                    setShowDropdown(false);
                  }}
                >
                  <ArrowUp size={14} />
                  <span>{filterType === "number" ? "Sort Smallest to Largest" : "Sort A to Z"}</span>
                  {isSorted && sortConfig.direction === "asc" && <Check size={14} />}
                </button>
                <button
                  style={{
                    ...styles.dropdownItem,
                    ...(isSorted && sortConfig.direction === "desc" ? styles.dropdownItemActive : {})
                  }}
                  onClick={() => {
                    onSort(field, "desc");
                    setShowDropdown(false);
                  }}
                >
                  <ArrowDown size={14} />
                  <span>{filterType === "number" ? "Sort Largest to Smallest" : "Sort Z to A"}</span>
                  {isSorted && sortConfig.direction === "desc" && <Check size={14} />}
                </button>
              </div>
              {enableFilter && <div style={styles.divider}></div>}
            </>
          )}

          {enableFilter && (
            <div style={styles.dropdownSection}>
              <div style={styles.sectionTitle}>
                <Filter size={12} />
                <span>Filter</span>
              </div>

              {filterType === "select" ? (
                <>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={styles.optionsList}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={!filterConfig[field] || filterConfig[field].length === 0}
                        onChange={() => onFilter(field, [])}
                      />
                      <span>(Select All)</span>
                    </label>
                    {filteredOptions.map((option) => (
                      <label key={option} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={!filterConfig[field] || filterConfig[field].length === 0 || filterConfig[field].includes(option)}
                          onChange={(e) => {
                            const currentFilters = filterConfig[field] || [];
                            if (e.target.checked) {
                              const newFilters = currentFilters.filter(f => f !== option);
                              onFilter(field, newFilters.length === options.length - 1 ? [] : [...currentFilters]);
                            } else {
                              onFilter(field, [...currentFilters, option]);
                            }
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </>
              ) : filterType === "date" ? (
                <div style={styles.dateFilterContainer}>
                  <input
                    type="date"
                    placeholder="From"
                    value={filterConfig[`${field}From`] || ""}
                    onChange={(e) => onFilter(`${field}From`, e.target.value)}
                    style={styles.dateInput}
                  />
                  <input
                    type="date"
                    placeholder="To"
                    value={filterConfig[`${field}To`] || ""}
                    onChange={(e) => onFilter(`${field}To`, e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder={`Filter ${label}...`}
                  value={filterConfig[field] || ""}
                  onChange={(e) => onFilter(field, e.target.value)}
                  style={styles.filterInput}
                />
              )}

              {hasActiveFilter && (
                <button
                  style={styles.clearFilterBtn}
                  onClick={() => {
                    if (filterType === "date") {
                      onFilter(`${field}From`, "");
                      onFilter(`${field}To`, "");
                    } else {
                      onFilter(field, filterType === "select" ? [] : "");
                    }
                    setShowDropdown(false);
                  }}
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </th>
  );
};

const WasteEntryExcel = ({ projectInfo }) => {
  // const [showDashboard, setShowDashboard] = useState(false);
  const [wasteEntries, setWasteEntries] = useState([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: null, direction: null });
  const [filterConfig, setFilterConfig] = useState({});
  const [showCopyIndicator, setShowCopyIndicator] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [expandedMonths, setExpandedMonths] = useState({});
     const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

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

  useEffect(() => {
    fetchWasteEntries();
  }, [projectInfo?._id]);

  const gridData = wasteEntries.map((entry) => {
    const data = entry.includeHazardous ? entry.hazardousData : entry.nonHazardousData;
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
      _originalEntry: entry
    };
  });

  const handleSort = (field, direction) => {
    setSortConfig({ field, direction });
  };

  const handleFilter = (field, value) => {
    setFilterConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearAllFilters = () => {
    setFilterConfig({});
    setSortConfig({ field: null, direction: null });
  };

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

  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const filteredData = gridData.filter((entry) => {
    if (filterConfig.wasteMaterial && !entry.wasteMaterial.toLowerCase().includes(filterConfig.wasteMaterial.toLowerCase())) {
      return false;
    }
    if (filterConfig.wasteHandler && !entry.wasteHandler.toLowerCase().includes(filterConfig.wasteHandler.toLowerCase())) {
      return false;
    }
    if (filterConfig.modeOfDisposal && !entry.modeOfDisposal.toLowerCase().includes(filterConfig.modeOfDisposal.toLowerCase())) {
      return false;
    }
    if (filterConfig.type && filterConfig.type.length > 0 && !filterConfig.type.includes(entry.type)) {
      return false;
    }
    if (filterConfig.unit && filterConfig.unit.length > 0 && !filterConfig.unit.includes(entry.unit)) {
      return false;
    }
    if (filterConfig.inputDateFrom && entry.inputDate < filterConfig.inputDateFrom) {
      return false;
    }
    if (filterConfig.inputDateTo && entry.inputDate > filterConfig.inputDateTo) {
      return false;
    }
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.field) return 0;

    let aValue = a[sortConfig.field];
    let bValue = b[sortConfig.field];

    const numericFields = ['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 
                          'incinerationWithoutHeat', 'landfill', 'exemption'];
    
    if (numericFields.includes(sortConfig.field)) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  const groupedData = groupByMonth(sortedData);
  const sortedMonths = Object.keys(groupedData).sort().reverse();

  useEffect(() => {
    const initialExpanded = {};
    sortedMonths.forEach(key => {
      initialExpanded[key] = true;
    });
    setExpandedMonths(initialExpanded);
  }, [sortedData.length]);

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

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
        setShowAddRow(false);
        
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
    } catch {
      showToast("Failed to add entry", "error");
    } finally {
      setLoading(false);
    }
  };

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
    } catch {
      showToast("Failed to delete entry", "error");
    }
  };

  const updateEntryInMongoDB = async (entryId, field, value) => {
    const token = getAuthToken();
    const entry = wasteEntries.find(e => e._id === entryId);
    if (!entry) return;

    const numericFields = ['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 
                          'incinerationWithoutHeat', 'landfill', 'exemption'];
    
    let updatePayload = {};
    
    if (numericFields.includes(field)) {
      const dataKey = entry.includeHazardous ? 'hazardousData' : 'nonHazardousData';
      updatePayload = {
        [dataKey]: {
          ...entry[dataKey],
          [field]: value
        }
      };
    } else {
      updatePayload = { [field]: value };
    }

    try {
      const response = await fetch(`${API_URL}/api/waste-entries/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();
      
      if (response.ok) {
        setWasteEntries(prev => prev.map(e => 
          e._id === entryId ? result.data : e
        ));
        showToast("Changes saved", "success");
      } else {
        showToast(result.message || "Failed to save changes", "error");
        fetchWasteEntries();
      }
    } catch (error) {
      console.error("Update error:", error);
      showToast("Failed to save changes", "error");
      fetchWasteEntries();
    }
  };

  const handleCellDoubleClick = (rowId, field, currentValue) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue || "");
  };

  const handleSaveCellEdit = async () => {
    if (editingCell) {
      const { rowId, field } = editingCell;
      
      const entry = gridData.find(e => e._id === rowId);
      if (entry) {
        setWasteEntries(prev => prev.map(e => {
          if (e._id === rowId) {
            const numericFields = ['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 
                                  'incinerationWithoutHeat', 'landfill', 'exemption'];
            
            if (numericFields.includes(field)) {
              const dataKey = e.includeHazardous ? 'hazardousData' : 'nonHazardousData';
              return {
                ...e,
                [dataKey]: {
                  ...e[dataKey],
                  [field]: editValue
                }
              };
            }
            return { ...e, [field]: editValue };
          }
          return e;
        }));
        
        await updateEntryInMongoDB(rowId, field, editValue);
      }
      
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleCancelCellEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingCell) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSaveCellEdit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleCancelCellEdit();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingCell, editValue]);

  const renderCell = (entry, field) => {
    const isEditing = editingCell?.rowId === entry._id && editingCell?.field === field;
    const value = entry[field];

    if (field === "type") {
      return (
        <span style={entry.type === "hazardous" ? styles.badgeHazardous : styles.badgeNonHazardous}>
          {entry.type === "hazardous" ? "Hazardous" : "Non-Hazardous"}
        </span>
      );
    }

    if (isEditing) {
      const numericFields = ['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 
                            'incinerationWithoutHeat', 'landfill', 'exemption'];
      const isNumeric = numericFields.includes(field);
      const isDate = field === "inputDate";
      
      if (field === "wasteMaterial") {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveCellEdit}
            autoFocus
            style={styles.editSelect}
          >
            <option value="">Select...</option>
            {WASTE_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        );
      }

      if (field === "modeOfDisposal") {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveCellEdit}
            autoFocus
            style={styles.editSelect}
          >
            <option value="">Select...</option>
            {DISPOSAL_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        );
      }

      if (field === "unit") {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveCellEdit}
            autoFocus
            style={styles.editSelect}
          >
            <option value="kg">kg</option>
            <option value="tonnes">Tonnes</option>
            <option value="metric_tonnes">MT</option>
          </select>
        );
      }

      return (
        <input
          type={isDate ? "date" : isNumeric ? "number" : "text"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveCellEdit}
          autoFocus
          style={{
            ...styles.editInput,
            ...(isNumeric ? { textAlign: 'right' } : {})
          }}
        />
      );
    }

    return <span>{value || "-"}</span>;
  };

  const handleExport = () => {
    const headers = [
      "Material", "Handler", "Disposal Mode", "Date", "Type", "Unit",
      "Total", "Reuse", "Recycle", "Composting", "Incineration (Heat)",
      "Incineration (No Heat)", "Landfill", "Exemption"
    ];

    const rows = sortedData.map(entry => [
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
    link.download = `waste_entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Object.keys(filterConfig).some(key => {
    const value = filterConfig[key];
    return Array.isArray(value) ? value.length > 0 : value !== "";
  });

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <h2 style={styles.title}>Waste Entry Spreadsheet</h2>
          <span style={styles.entryCount}>
            {sortedData.length} {sortedData.length !== gridData.length && `of ${gridData.length}`} entries
          </span>
          {hasActiveFilters && (
            <button style={styles.clearAllBtn} onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>
        <div style={styles.toolbarRight}>
          <button style={styles.addBtn} onClick={() => setShowAddRow(!showAddRow)}>
            <Plus size={16} />
            Add Entry
          </button>
          <button style={styles.toolbarBtn} onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
          {/* <button className={styles.dashboardBtn} onClick={() => setShowDashboard(true)}>
            <BarChart3 size={16} />
            Dashboard
          </button> */}
        </div>
      </div>

      <div style={styles.infoBanner}>
        Click column headers to sort and filter.
      </div>

      {fetchLoading && (
        <div style={styles.loadingState}>Loading waste entries...</div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <ColumnHeader label="Material" field="wasteMaterial" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="text" enableSort={true} enableFilter={true} />
              <ColumnHeader label="Handler" field="wasteHandler" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="text" enableSort={true} enableFilter={true} />
              <ColumnHeader label="Disposal Mode" field="modeOfDisposal" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="text" enableSort={true} enableFilter={true} />
              <ColumnHeader label="Date" field="inputDate" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="date" enableSort={true} enableFilter={true} />
              <ColumnHeader label="Type" field="type" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="select" options={["hazardous", "nonHazardous"]} enableSort={false} enableFilter={true} />
              <ColumnHeader label="Unit" field="unit" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="select" options={["kg", "tonnes", "metric_tonnes"]} enableSort={false} enableFilter={true} />
              <ColumnHeader label="Total" field="total" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Reuse" field="reuse" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Recycle" field="recycle" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Composting" field="composting" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Incin. (Heat)" field="incinerationWithHeat" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Incin. (No Heat)" field="incinerationWithoutHeat" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Landfill" field="landfill" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Exemption" field="exemption" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAddRow && (
              <tr style={styles.newRow}>
                <td style={styles.td}>
                  <select style={styles.select} value={newRow.wasteMaterial} onChange={(e) => setNewRow({...newRow, wasteMaterial: e.target.value})}>
                    <option value="">Select...</option>
                    {WASTE_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </td>
                <td style={styles.td}>
                  <input style={styles.input} placeholder="Handler..." value={newRow.wasteHandler} onChange={(e) => setNewRow({...newRow, wasteHandler: e.target.value})} />
                </td>
                <td style={styles.td}>
                  <select style={styles.select} value={newRow.modeOfDisposal} onChange={(e) => setNewRow({...newRow, modeOfDisposal: e.target.value})}>
                    <option value="">Select...</option>
                    {DISPOSAL_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </td>
                <td style={styles.td}>
                  <input type="date" style={styles.input} value={newRow.inputDate} onChange={(e) => setNewRow({...newRow, inputDate: e.target.value})} />
                </td>
                <td style={styles.td}>
                  <select style={styles.select} value={newRow.type} onChange={(e) => setNewRow({...newRow, type: e.target.value})}>
                    <option value="hazardous">Hazardous</option>
                    <option value="nonHazardous">Non-Hazardous</option>
                  </select>
                </td>
                <td style={styles.td}>
                  <select style={styles.select} value={newRow.unit} onChange={(e) => setNewRow({...newRow, unit: e.target.value})}>
                    <option value="kg">kg</option>
                    <option value="tonnes">Tonnes</option>
                    <option value="metric_tonnes">MT</option>
                  </select>
                </td>
                {['total', 'reuse', 'recycle', 'composting', 'incinerationWithHeat', 'incinerationWithoutHeat', 'landfill', 'exemption'].map(field => (
                  <td key={field} style={styles.td}>
                    <input type="number" style={{...styles.input, textAlign: 'right'}} placeholder="0" value={newRow[field]} onChange={(e) => setNewRow({...newRow, [field]: e.target.value})} />
                  </td>
                ))}
                <td style={styles.td}>
                  <button onClick={handleAddRow} disabled={loading} style={styles.saveBtn}>
                    <Plus size={16} />
                  </button>
                </td>
              </tr>
            )}

            {sortedMonths.length === 0 ? (
              <tr>
                <td colSpan="15" style={styles.emptyState}>
                  No entries yet. Add your first entry above.
                </td>
              </tr>
            ) : (
              sortedMonths.map((monthKey) => (
                <>
                  <tr key={`header-${monthKey}`} onClick={() => toggleMonth(monthKey)} style={styles.monthHeader}>
                    <td colSpan="15" style={styles.monthHeaderCell}>
                      <span style={styles.monthArrow}>{expandedMonths[monthKey] ? '▼' : '▶'}</span> {formatMonth(monthKey)} ({groupedData[monthKey].length} entries)
                    </td>
                  </tr>
                  {expandedMonths[monthKey] && groupedData[monthKey].map((entry, idx) => (
                    <tr key={entry._id} style={{...styles.dataRow, ...(idx % 2 === 0 ? styles.evenRow : {})}}>
                      <td style={{...styles.td, ...styles.editableCell}} onDoubleClick={() => handleCellDoubleClick(entry._id, "wasteMaterial", entry.wasteMaterial)}>
                        {renderCell(entry, "wasteMaterial")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell}} onDoubleClick={() => handleCellDoubleClick(entry._id, "wasteHandler", entry.wasteHandler)}>
                        {renderCell(entry, "wasteHandler")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell}} onDoubleClick={() => handleCellDoubleClick(entry._id, "modeOfDisposal", entry.modeOfDisposal)}>
                        {renderCell(entry, "modeOfDisposal")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell}} onDoubleClick={() => handleCellDoubleClick(entry._id, "inputDate", entry.inputDate)}>
                        {renderCell(entry, "inputDate")}
                      </td>
                      <td style={styles.td}>
                        {renderCell(entry, "type")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell}} onDoubleClick={() => handleCellDoubleClick(entry._id, "unit", entry.unit)}>
                        {renderCell(entry, "unit")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "total", entry.total)}>
                        {renderCell(entry, "total")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "reuse", entry.reuse)}>
                        {renderCell(entry, "reuse")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "recycle", entry.recycle)}>
                        {renderCell(entry, "recycle")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "composting", entry.composting)}>
                        {renderCell(entry, "composting")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "incinerationWithHeat", entry.incinerationWithHeat)}>
                        {renderCell(entry, "incinerationWithHeat")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "incinerationWithoutHeat", entry.incinerationWithoutHeat)}>
                        {renderCell(entry, "incinerationWithoutHeat")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "landfill", entry.landfill)}>
                        {renderCell(entry, "landfill")}
                      </td>
                      <td style={{...styles.td, ...styles.editableCell, textAlign: 'right'}} onDoubleClick={() => handleCellDoubleClick(entry._id, "exemption", entry.exemption)}>
                        {renderCell(entry, "exemption")}
                      </td>
                      <td style={styles.td}>
                        <button style={styles.deleteBtn} onClick={() => handleDeleteEntry(entry._id)}>
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

      {showCopyIndicator && (
        <div style={styles.copyIndicator}>
          ✓ Copied to clipboard
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)', borderBottom: '1px solid #e5e7eb' },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  toolbarRight: { display: 'flex', gap: '8px' },
  title: { fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 },
  entryCount: { padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  clearAllBtn: { padding: '4px 10px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
toolbarBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#194d2a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
dashboardBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#194d2a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#194d2a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  backButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#194d2a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  infoBanner: { padding: '10px 20px', background: '#dbeafe', borderBottom: '1px solid #93c5fd', fontSize: '12px', color: '#1e40af' },
  tableWrapper: { flex: 1, overflow: 'auto', background: '#f9fafb' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#ffffff', fontSize: '13px', minWidth: '1800px' },
  th: { position: 'relative', padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#374151', background: '#f3f4f6', borderRight: '1px solid #e5e7eb', borderBottom: '2px solid #d1d5db', whiteSpace: 'nowrap' },
  headerContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' },
  headerLabel: { flex: 1 },
  headerButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '25px', height: '20px', background: 'transparent', border: '1px solid transparent', borderRadius: '4px', cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s' },
  headerButtonActive: { background: '#10b981', color: '#ffffff', borderColor: '#059669' },
  dropdown: { position: 'absolute', top: '100%', left: 0, minWidth: '240px', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', zIndex: 1000, marginTop: '4px' },
  dropdownSection: { padding: '8px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: '4px', fontSize: '13px', color: '#374151', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' },
  dropdownItemActive: { background: '#e0f2fe', color: '#0369a1', fontWeight: '600' },
  divider: { height: '1px', background: '#e5e7eb', margin: '4px 0' },
  searchInput: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' },
  optionsList: { maxHeight: '200px', overflowY: 'auto' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.1s' },
  dateFilterContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  dateInput: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' },
  filterInput: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' },
  clearFilterBtn: { width: '100%', padding: '6px 10px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  td: { padding: '8px 12px', border: '1px solid #e5e7eb', background: '#ffffff' },
  editableCell: { cursor: 'pointer', transition: 'background 0.1s', position: 'relative' },
  editInput: { width: '100%', padding: '6px 8px', border: '2px solid #10b981', borderRadius: '4px', fontSize: '13px', outline: 'none', background: '#f0fdf4' },
  editSelect: { width: '100%', padding: '6px 8px', border: '2px solid #10b981', borderRadius: '4px', fontSize: '13px', outline: 'none', background: '#f0fdf4', cursor: 'pointer' },
  newRow: { background: '#f0fdf4', borderBottom: '2px solid #10b981' },
  dataRow: { transition: 'background 0.1s' },
  evenRow: { background: '#fafbfc' },
  input: { width: '100%', padding: '6px 8px', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none' },
  select: { width: '100%', padding: '6px 8px', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', outline: 'none' },
  saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  deleteBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', color: '#dc2626', border: '1px solid transparent', borderRadius: '4px', cursor: 'pointer', margin: '0 auto' },
  badgeHazardous: { display: 'inline-block', padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
  badgeNonHazardous: { display: 'inline-block', padding: '4px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
  emptyState: { padding: '60px 20px', textAlign: 'center', color: '#6b7280', fontSize: '14px', background: '#fafbfc' },
  loadingState: { padding: '40px 20px', textAlign: 'center', color: '#6b7280', fontSize: '14px', background: '#f9fafb' },
  copyIndicator: { position: 'fixed', bottom: '20px', right: '20px', padding: '12px 16px', background: '#10b981', color: '#ffffff', borderRadius: '8px', fontSize: '13px', fontWeight: '500', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', zIndex: 1000 },
  monthHeader: { background: '#194d2a', cursor: 'pointer', userSelect: 'none' },
  monthHeaderCell: { padding: '10px 16px', fontSize: '12px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' },
  monthArrow: { display: 'inline-block', width: '16px', textAlign: 'center' }
};

export default WasteEntryExcel;