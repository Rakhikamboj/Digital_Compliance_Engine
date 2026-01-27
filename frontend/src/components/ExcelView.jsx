import { useState, useEffect, useRef } from "react";
import { Plus, Download, X, ChevronDown, ArrowUp, ArrowDown, Filter, Check, Calendar } from "lucide-react";
import styles from "../styles/ExcelView.module.css";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:5000";

const WASTE_MATERIALS = [
  "Paper", "Plastic", "Metal", "Electronics", "Medical Waste",
  "Sludges", "Ash", "Waste Water", "Agriculture Waste", "Glass",
  "Textile", "Construction Waste", "Chemical Waste", "Biological Waste", "Others"
];

const DISPOSAL_MODES = [
  "Recycling", "Composting", "Reuse", "Landfill",
  "Incineration with Heat Recovery", "Incineration without Heat Recovery",
  "Treatment", "Others"
];

// Month/Year Picker Component
const MonthYearPicker = ({ value, onChange, reportingPeriod, className }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const pickerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [year, month] = value.split("-");
      setSelectedYear(year);
      setSelectedMonth(month);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    // Allow selection of past 5 years, current year, and next 2 years
    return Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);
  };

  const getValidMonths = (year) => {
    // Allow all months for any year
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const yearRange = getYearRange();
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    if (selectedYear && month) {
      const newValue = `${selectedYear}-${month}`;
      onChange(newValue);
      setShowPicker(false);
    }
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
  };

  const formatDisplayValue = () => {
    if (!value) return "Select Month & Year";
    const [year, month] = value.split("-");
    const monthObj = months.find(m => m.value === month);
    return `${monthObj?.label.slice(0, 3)} ${year}`;
  };

  return (
    <div className={styles.monthYearPickerContainer} ref={pickerRef}>
      <button
        type="button"
        className={`${className} ${styles.monthYearButton}`}
        onClick={() => setShowPicker(!showPicker)}
      >
        <Calendar size={16} />
        <span>{formatDisplayValue()}</span>
        <ChevronDown size={16} />
      </button>

      {showPicker && (
        <div className={styles.monthYearDropdown}>
          <div className={styles.pickerSection}>
            <div className={styles.pickerTitle}>Select Year</div>
            <div className={styles.yearGrid}>
              {yearRange.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={`${styles.yearOption} ${selectedYear === String(year) ? styles.yearOptionSelected : ''}`}
                  onClick={() => handleYearSelect(String(year))}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {selectedYear && (
            <>
              <div className={styles.pickerDivider}></div>
              <div className={styles.pickerSection}>
                <div className={styles.pickerTitle}>Select Month</div>
                <div className={styles.monthGrid}>
                  {months.map((month) => {
                    const validMonths = getValidMonths(selectedYear);
                    const isValid = validMonths.includes(parseInt(month.value));
                    return (
                      <button
                        key={month.value}
                        type="button"
                        className={`${styles.monthOption} ${
                          selectedMonth === month.value ? styles.monthOptionSelected : ''
                        }`}
                        onClick={() => isValid && handleMonthSelect(month.value)}
                        disabled={!isValid}
                      >
                        {month.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Column Header Component
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
      <th className={styles.th}>
        <div className={styles.headerContent}>
          <span className={styles.headerLabel}>{label}</span>
        </div>
      </th>
    );
  }

  return (
    <th className={styles.th}>
      <div className={styles.headerContent}>
        <span className={styles.headerLabel}>{label}</span>
        <button 
          className={`${styles.headerButton} ${hasActiveFilter || isSorted ? styles.headerButtonActive : ''}`}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {enableSort && (
            <>
              <div className={styles.dropdownSection}>
                <div className={styles.sectionTitle}>Sort</div>
                <button
                  className={`${styles.dropdownItem} ${isSorted && sortConfig.direction === "asc" ? styles.dropdownItemActive : ''}`}
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
                  className={`${styles.dropdownItem} ${isSorted && sortConfig.direction === "desc" ? styles.dropdownItemActive : ''}`}
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
              {enableFilter && <div className={styles.divider}></div>}
            </>
          )}

          {enableFilter && (
            <div className={styles.dropdownSection}>
              <div className={styles.sectionTitle}>
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
                    className={styles.searchInput}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={styles.optionsList}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={!filterConfig[field] || filterConfig[field].length === 0}
                        onChange={() => onFilter(field, [])}
                      />
                      <span>(Select All)</span>
                    </label>
                    {filteredOptions.map((option) => (
                      <label key={option} className={styles.checkboxLabel}>
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
              ) : filterType === "month" ? (
                <div className={styles.monthFilterContainer}>
                  <input
                    type="month"
                    placeholder="From"
                    value={filterConfig[`${field}From`] || ""}
                    onChange={(e) => onFilter(`${field}From`, e.target.value)}
                    className={styles.monthInput}
                  />
                  <input
                    type="month"
                    placeholder="To"
                    value={filterConfig[`${field}To`] || ""}
                    onChange={(e) => onFilter(`${field}To`, e.target.value)}
                    className={styles.monthInput}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder={`Filter ${label}...`}
                  value={filterConfig[field] || ""}
                  onChange={(e) => onFilter(field, e.target.value)}
                  className={styles.filterInput}
                />
              )}

              {hasActiveFilter && (
                <button
                  className={styles.clearFilterBtn}
                  onClick={() => {
                    if (filterType === "month") {
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
  const [wasteEntries, setWasteEntries] = useState([]);
  const [showAddRow, setShowAddRow] = useState(true);
  const [sortConfig, setSortConfig] = useState({ field: null, direction: null });
  const [filterConfig, setFilterConfig] = useState({});
  const [showCopyIndicator, setShowCopyIndicator] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupBy, setGroupBy] = useState("month");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [duplicateMonthMessage, setDuplicateMonthMessage] = useState("");

  // Get current month-year
  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  // Format month-year for display (e.g., "Jan 2026")
  const formatMonthYearDisplay = (monthYear) => {
    if (!monthYear) return "";
    const [year, month] = monthYear.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // Initialize newRow with all fields defined
  const [newRow, setNewRow] = useState({
    wasteMaterial: "",
    wasteHandler: "",
    modeOfDisposal: "",
    inputMonthYear: getCurrentMonthYear(),
    type: "hazardous",
    unit: "kg",
    total: "0", // Will be auto-calculated
    reuse: "",
    recycle: "",
    composting: "",
    incinerationWithHeat: "",
    incinerationWithoutHeat: "",
    landfill: "",
    exemption: "",
  });

  // Auto-calculate total whenever disposal fields change
  const calculateTotal = (row) => {
    const total =
      (parseFloat(row.reuse) || 0) +
      (parseFloat(row.recycle) || 0) +
      (parseFloat(row.composting) || 0) +
      (parseFloat(row.incinerationWithHeat) || 0) +
      (parseFloat(row.incinerationWithoutHeat) || 0) +
      (parseFloat(row.landfill) || 0) +
      (parseFloat(row.exemption) || 0);
    
    return total.toFixed(2);
  };

  // Update newRow whenever disposal fields change
  useEffect(() => {
    const autoTotal = calculateTotal(newRow);
    if (newRow.total !== autoTotal) {
      setNewRow(prev => ({ ...prev, total: autoTotal }));
    }
  }, [
    newRow.reuse,
    newRow.recycle,
    newRow.composting,
    newRow.incinerationWithHeat,
    newRow.incinerationWithoutHeat,
    newRow.landfill,
    newRow.exemption
  ]);

  // Check for duplicate month when month changes
  useEffect(() => {
    if (newRow.inputMonthYear) {
      const existingEntry = wasteEntries.find(entry => 
        dateToMonthYear(entry.inputDate) === newRow.inputMonthYear
      );
      
      if (existingEntry) {
        setDuplicateMonthMessage(
          `Data for ${formatMonthYearDisplay(newRow.inputMonthYear)} already exists. Please edit the existing record.`
        );
      } else {
        setDuplicateMonthMessage("");
      }
    }
  }, [newRow.inputMonthYear, wasteEntries]);

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

  // Convert month-year to full date (first day of the month)
  const monthYearToDate = (monthYear) => {
    if (!monthYear) return null;
    const [year, month] = monthYear.split("-");
    return `${year}-${month}-01`;
  };

  // Convert date to month-year
  const dateToMonthYear = (date) => {
    if (!date) return "";
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const fetchWasteEntries = async () => {
    try {
      setFetchLoading(true);
      const token = getAuthToken();
      const userId = getUserIdFromToken();
      const projectId = projectInfo?._id;

      if (!token || !userId) {
        console.error("Please log in to view waste entries");
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
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchWasteEntries();
  }, [projectInfo?._id]);

  const gridData = wasteEntries.map((entry) => {
    const data = entry.includeHazardous ? entry.hazardousData : entry.nonHazardousData;
    const monthYear = dateToMonthYear(entry.inputDate);
    
    return {
      _id: entry._id,
      wasteMaterial: entry.wasteMaterial || "",
      wasteHandler: entry.wasteHandler || "",
      modeOfDisposal: entry.modeOfDisposal || "",
      inputMonthYear: monthYear,
      type: entry.includeHazardous ? "hazardous" : "nonHazardous",
      unit: entry.unit || "kg",
      total: data?.total || "0",
      reuse: data?.reuse || "0",
      recycle: data?.recycle || "0",
      composting: data?.composting || "0",
      incinerationWithHeat: data?.incinerationWithHeat || "0",
      incinerationWithoutHeat: data?.incinerationWithoutHeat || "0",
      landfill: data?.landfill || "0",
      exemption: data?.exemption || "0",
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
      const monthKey = entry.inputMonthYear;
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(entry);
    });
    return grouped;
  };

  const groupByMaterial = (entries) => {
    const grouped = {};
    entries.forEach((entry) => {
      const materialKey = entry.wasteMaterial || "Uncategorized";
      if (!grouped[materialKey]) grouped[materialKey] = [];
      grouped[materialKey].push(entry);
    });
    return grouped;
  };

  const groupByType = (entries) => {
    const grouped = {};
    entries.forEach((entry) => {
      const typeKey = entry.type === "hazardous" ? "Hazardous" : "Non-Hazardous";
      if (!grouped[typeKey]) grouped[typeKey] = [];
      grouped[typeKey].push(entry);
    });
    return grouped;
  };

  const formatGroupKey = (key) => {
    if (groupBy === "month") {
      return formatMonthYearDisplay(key);
    }
    return key;
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
    if (filterConfig.inputMonthYearFrom && entry.inputMonthYear < filterConfig.inputMonthYearFrom) {
      return false;
    }
    if (filterConfig.inputMonthYearTo && entry.inputMonthYear > filterConfig.inputMonthYearTo) {
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

  const getGroupedData = () => {
    switch (groupBy) {
      case "material":
        return groupByMaterial(sortedData);
      case "type":
        return groupByType(sortedData);
      default:
        return groupByMonth(sortedData);
    }
  };

  const groupedData = getGroupedData();
  
  const sortedGroupKeys = Object.keys(groupedData).sort((a, b) => {
    if (groupBy === "month") {
      return b.localeCompare(a);
    }
    return a.localeCompare(b);
  });

  useEffect(() => {
    const initialExpanded = {};
    sortedGroupKeys.forEach(key => {
      initialExpanded[key] = false;
    });
    setExpandedGroups(initialExpanded);
  }, [sortedData.length, groupBy]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleAddRow = async () => {
    if (!newRow.wasteMaterial) {
      alert("Please select a waste material");
      return;
    }

    const total = parseFloat(newRow.total) || 0;
    if (total <= 0) {
      alert("Total must be greater than 0. Please enter at least one disposal value.");
      return;
    }

    // Check if month already exists
    const existingEntry = wasteEntries.find(entry => 
      dateToMonthYear(entry.inputDate) === newRow.inputMonthYear
    );
    
    if (existingEntry) {
      alert(`Data for ${formatMonthYearDisplay(newRow.inputMonthYear)} already exists. Please edit the existing record.`);
      return;
    }

    setLoading(true);
    const token = getAuthToken();
    const userId = getUserIdFromToken();
    const projectId = projectInfo?._id;

    // Convert month-year to full date
    const inputDate = monthYearToDate(newRow.inputMonthYear);

    // Build disposal data object with all fields defined
    const disposalData = {
      total: newRow.total,
      reuse: newRow.reuse || "0",
      recycle: newRow.recycle || "0",
      composting: newRow.composting || "0",
      incinerationWithHeat: newRow.incinerationWithHeat || "0",
      incinerationWithoutHeat: newRow.incinerationWithoutHeat || "0",
      landfill: newRow.landfill || "0",
      exemption: newRow.exemption || "0",
    };

    // Calculate diversion for the new entry
    const calculateDiversion = (data) => {
      const total = parseFloat(data.total) || 0;
      const diversion =
        (parseFloat(data.reuse) || 0) +
        (parseFloat(data.recycle) || 0) +
        (parseFloat(data.composting) || 0) +
        (parseFloat(data.incinerationWithHeat) || 0) +
        (parseFloat(data.incinerationWithoutHeat) || 0);

      return {
        diversion: diversion.toFixed(2),
        diversionPercent: total > 0 ? ((diversion / total) * 100).toFixed(2) : "0.00",
      };
    };

    const newEntry = {
      userId,
      projectId,
      reportingPeriod: projectInfo?.reportingPeriod || null,
      wasteMaterial: newRow.wasteMaterial,
      wasteHandler: newRow.wasteHandler || null,
      modeOfDisposal: newRow.modeOfDisposal || null,
      inputDate: inputDate,
      unit: newRow.unit,
      includeHazardous: newRow.type === "hazardous",
      includeNonHazardous: newRow.type === "nonHazardous",
      hazardousData: newRow.type === "hazardous" ? disposalData : null,
      nonHazardousData: newRow.type === "nonHazardous" ? disposalData : null,
    };

    // Add diversion calculations
    if (newRow.type === "hazardous") {
      const haz = calculateDiversion(disposalData);
      newEntry.hazardousDiversion = haz.diversion;
      newEntry.hazardousDiversionPercent = haz.diversionPercent;
    } else {
      const nonHaz = calculateDiversion(disposalData);
      newEntry.nonHazardousDiversion = nonHaz.diversion;
      newEntry.nonHazardousDiversionPercent = nonHaz.diversionPercent;
    }

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
        setShowAddRow(false);
        setDuplicateMonthMessage("");
        
        // Reset form with all fields defined
        setNewRow({
          wasteMaterial: "",
          wasteHandler: "",
          modeOfDisposal: "",
          inputMonthYear: getCurrentMonthYear(),
          type: "hazardous",
          unit: "kg",
          total: "0",
          reuse: "",
          recycle: "",
          composting: "",
          incinerationWithHeat: "",
          incinerationWithoutHeat: "",
          landfill: "",
          exemption: "",
        });
      } else {
        alert(result.message || "Failed to add entry");
      }
    } catch (err) {
      console.error("Failed to add entry:", err);
      alert("Failed to add entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}/api/waste-entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setWasteEntries((prev) => prev.filter((e) => e._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
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
      
      // If updating a disposal field (not total), recalculate total
      if (field !== 'total') {
        const currentData = { ...entry[dataKey], [field]: value };
        const recalculatedTotal = calculateTotal({
          reuse: currentData.reuse,
          recycle: currentData.recycle,
          composting: currentData.composting,
          incinerationWithHeat: currentData.incinerationWithHeat,
          incinerationWithoutHeat: currentData.incinerationWithoutHeat,
          landfill: currentData.landfill,
          exemption: currentData.exemption,
        });
        
        updatePayload = {
          [dataKey]: {
            ...currentData,
            total: recalculatedTotal
          }
        };
      } else {
        updatePayload = {
          [dataKey]: {
            ...entry[dataKey],
            [field]: value
          }
        };
      }
    } else if (field === 'inputMonthYear') {
      // Convert month-year to full date
      updatePayload = { inputDate: monthYearToDate(value) };
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
      } else {
        fetchWasteEntries();
      }
    } catch (error) {
      console.error("Update error:", error);
      fetchWasteEntries();
    }
  };

  const handleCellDoubleClick = (rowId, field, currentValue) => {
    // Don't allow editing total field
    if (field === 'total') {
      alert("Total is auto-calculated and cannot be edited directly. Please update the disposal fields.");
      return;
    }
    setEditingCell({ rowId, field });
    setEditValue(currentValue || "");
  };

  const handleSaveCellEdit = async () => {
    if (editingCell) {
      const { rowId, field } = editingCell;
      
      await updateEntryInMongoDB(rowId, field, editValue);
      
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
        <span className={entry.type === "hazardous" ? styles.badgeHazardous : styles.badgeNonHazardous}>
          {entry.type === "hazardous" ? "Hazardous" : "Non-Hazardous"}
        </span>
      );
    }

    if (field === "total") {
      return (
        <span className={styles.autoCalculatedBadge} title="Auto-calculated from disposal fields">
          {value}
        </span>
      );
    }

    if (field === "inputMonthYear") {
      if (isEditing) {
        return (
          <MonthYearPicker
            value={editValue}
            onChange={(val) => {
              setEditValue(val);
              setTimeout(() => handleSaveCellEdit(), 100);
            }}
            reportingPeriod={projectInfo?.reportingPeriod}
            className={styles.editInput}
          />
        );
      }
      return <span>{formatMonthYearDisplay(value)}</span>;
    }

    if (isEditing) {
      const numericFields = ['reuse', 'recycle', 'composting', 'incinerationWithHeat', 
                            'incinerationWithoutHeat', 'landfill', 'exemption'];
      const isNumeric = numericFields.includes(field);
      
      if (field === "wasteMaterial") {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveCellEdit}
            autoFocus
            className={styles.editSelect}
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
            className={styles.editSelect}
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
            className={styles.editSelect}
          >
            <option value="kg">kg</option>
            <option value="tonnes">Tonnes</option>
            <option value="metric_tonnes">MT</option>
          </select>
        );
      }

      return (
        <input
          type={isNumeric ? "number" : "text"}
          step={isNumeric ? "0.01" : undefined}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveCellEdit}
          autoFocus
          className={`${styles.editInput} ${isNumeric ? styles.editInputNumeric : ''}`}
        />
      );
    }

    return <span>{value || "-"}</span>;
  };

  const handleExport = () => {
    const headers = [
      "Material", "Handler", "Disposal Mode", "Month-Year", "Type", "Unit",
      "Total", "Reuse", "Recycle", "Composting", "Incineration (Heat)",
      "Incineration (No Heat)", "Landfill", "Exemption"
    ];

    const rows = sortedData.map(entry => {
      const formattedDate = formatMonthYearDisplay(entry.inputMonthYear);
      
      return [
        entry.wasteMaterial,
        entry.wasteHandler,
        entry.modeOfDisposal,
        formattedDate,
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
      ];
    });

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
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {hasActiveFilters && (
            <button className={styles.clearAllBtn} onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value)}
            className={styles.groupBySelect}
          >
            <option value="month">Group by Month</option>
            <option value="material">Group by Material</option>
            <option value="type">Group by Type</option>
          </select>
          <button className={styles.toolbarBtn} onClick={handleExport}>
            <Download size={16} />
          </button>
        </div>
      </div>

      {fetchLoading && (
        <div className={styles.loadingState}>Loading waste entries...</div>
      )}

      {duplicateMonthMessage && (
        <div className={styles.duplicateMonthWarning}>
          ⚠️ {duplicateMonthMessage}
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <ColumnHeader label="Material" field="wasteMaterial" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="text" />
              <ColumnHeader label="Handler" field="wasteHandler" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="text" />
              <ColumnHeader label="Disposal Mode" field="modeOfDisposal" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="text" />
              <ColumnHeader label="Month-Year" field="inputMonthYear" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="month" />
              <ColumnHeader label="Type" field="type" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="select" options={["hazardous", "nonHazardous"]} enableSort={false} />
              <ColumnHeader label="Unit" field="unit" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} filterType="select" options={["kg", "tonnes", "metric_tonnes"]} enableSort={false} />
              <ColumnHeader label="Total (Auto)" field="total" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Reuse" field="reuse" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Recycle" field="recycle" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Composting" field="composting" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Incin. (Heat)" field="incinerationWithHeat" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Incin. (No Heat)" field="incinerationWithoutHeat" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Landfill" field="landfill" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <ColumnHeader label="Exemption" field="exemption" sortConfig={sortConfig} onSort={handleSort} filterConfig={filterConfig} onFilter={handleFilter} enableSort={false} enableFilter={false} />
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAddRow && (
              <tr className={styles.newRow}>
                <td className={styles.td}>
                  <select 
                    className={styles.select} 
                    value={newRow.wasteMaterial} 
                    onChange={(e) => setNewRow({...newRow, wasteMaterial: e.target.value})}
                  >
                    <option value="">Select...</option>
                    {WASTE_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </td>
                <td className={styles.td}>
                  <input 
                    className={styles.input} 
                    placeholder="Handler..." 
                    value={newRow.wasteHandler} 
                    onChange={(e) => setNewRow({...newRow, wasteHandler: e.target.value})} 
                  />
                </td>
                <td className={styles.td}>
                  <select 
                    className={styles.select} 
                    value={newRow.modeOfDisposal} 
                    onChange={(e) => setNewRow({...newRow, modeOfDisposal: e.target.value})}
                  >
                    <option value="">Select...</option>
                    {DISPOSAL_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </td>
                <td className={styles.td}>
                  <MonthYearPicker
                    value={newRow.inputMonthYear}
                    onChange={(val) => setNewRow({...newRow, inputMonthYear: val})}
                    reportingPeriod={projectInfo?.reportingPeriod}
                    className={styles.input}
                  />
                </td>
                <td className={styles.td}>
                  <select 
                    className={styles.select} 
                    value={newRow.type} 
                    onChange={(e) => setNewRow({...newRow, type: e.target.value})}
                  >
                    <option value="hazardous">Hazardous</option>
                    <option value="nonHazardous">Non-Hazardous</option>
                  </select>
                </td>
                <td className={styles.td}>
                  <select 
                    className={styles.select} 
                    value={newRow.unit} 
                    onChange={(e) => setNewRow({...newRow, unit: e.target.value})}
                  >
                    <option value="kg">kg</option>
                    <option value="tonnes">Tonnes</option>
                    <option value="metric_tonnes">MT</option>
                  </select>
                </td>
                <td className={styles.td}>
                  <input 
                    type="text" 
                    className={`${styles.input} ${styles.inputReadOnly}`} 
                    value={newRow.total}
                    readOnly
                    disabled
                    title="Auto-calculated from disposal fields"
                  />
                </td>
                {['reuse', 'recycle', 'composting', 'incinerationWithHeat', 'incinerationWithoutHeat', 'landfill', 'exemption'].map(field => (
                  <td key={field} className={styles.td}>
                    <input 
                      type="number"
                      step="0.01"
                      className={`${styles.input} ${styles.inputNumeric}`} 
                      placeholder="0.00" 
                      value={newRow[field]} 
                      onChange={(e) => setNewRow({...newRow, [field]: e.target.value})} 
                    />
                  </td>
                ))}
                <td className={styles.td}>
                  <button onClick={handleAddRow} disabled={loading} className={styles.saveBtn}>
                    <Plus size={16} />
                  </button>
                </td>
              </tr>
            )}

            {sortedGroupKeys.length === 0 ? (
              <tr>
                <td colSpan="15" className={styles.emptyState}>
                  No entries yet. Add your first entry above.
                </td>
              </tr>
            ) : (
              sortedGroupKeys.map((groupKey) => (
                <>
                  <tr key={`header-${groupKey}`} onClick={() => toggleGroup(groupKey)} className={styles.monthHeader}>
                    <td colSpan="15" className={styles.monthHeaderCell}>
                      <span className={styles.monthArrow}>{expandedGroups[groupKey] ? '▼' : '▶'}</span> {formatGroupKey(groupKey)} ({groupedData[groupKey].length} entries)
                    </td>
                  </tr>
                  {expandedGroups[groupKey] && groupedData[groupKey].map((entry, idx) => (
                    <tr key={entry._id} className={`${styles.dataRow} ${idx % 2 === 0 ? styles.evenRow : ''}`}>
                      <td className={`${styles.td} ${styles.editableCell}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "wasteMaterial", entry.wasteMaterial)}>
                        {renderCell(entry, "wasteMaterial")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "wasteHandler", entry.wasteHandler)}>
                        {renderCell(entry, "wasteHandler")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "modeOfDisposal", entry.modeOfDisposal)}>
                        {renderCell(entry, "modeOfDisposal")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "inputMonthYear", entry.inputMonthYear)}>
                        {renderCell(entry, "inputMonthYear")}
                      </td>
                      <td className={styles.td}>
                        {renderCell(entry, "type")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "unit", entry.unit)}>
                        {renderCell(entry, "unit")}
                      </td>
                      <td className={`${styles.td} ${styles.tdNumeric}`} title="Auto-calculated - double-click disabled">
                        {renderCell(entry, "total")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell} ${styles.tdNumeric}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "reuse", entry.reuse)}>
                        {renderCell(entry, "reuse")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell} ${styles.tdNumeric}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "recycle", entry.recycle)}>
                        {renderCell(entry, "recycle")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell} ${styles.tdNumeric}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "composting", entry.composting)}>
                        {renderCell(entry, "composting")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell} ${styles.tdNumeric}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "incinerationWithHeat", entry.incinerationWithHeat)}>
                        {renderCell(entry, "incinerationWithHeat")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell} ${styles.tdNumeric}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "incinerationWithoutHeat", entry.incinerationWithoutHeat)}>
                        {renderCell(entry, "incinerationWithoutHeat")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell} ${styles.tdNumeric}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "landfill", entry.landfill)}>
                        {renderCell(entry, "landfill")}
                      </td>
                      <td className={`${styles.td} ${styles.editableCell} ${styles.tdNumeric}`} onDoubleClick={() => handleCellDoubleClick(entry._id, "exemption", entry.exemption)}>
                        {renderCell(entry, "exemption")}
                      </td>
                      <td className={styles.td}>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteEntry(entry._id)}>
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
        <div className={styles.copyIndicator}>
          ✓ Copied to clipboard
        </div>
      )}
    </div>
  );
};

export default WasteEntryExcel;