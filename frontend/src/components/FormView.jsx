import React, { useState, useEffect } from "react";
import { Plus, AlertCircle, CheckCircle } from "lucide-react";
import styles from "../styles/FormView.module.css"

const API_URL = import.meta.env.VITE_API_KEY;

const WasteDataEntryForm = ({ projectInfo }) => {
  const [wasteEntries, setWasteEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hazardous");
  const [selectedUnit, setSelectedUnit] = useState("kg");

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
  });

  const [errors, setErrors] = useState({});

  /**
   * Get start and end date from reporting period
   */
  const getReportingPeriodRange = (reportingPeriod) => {
    if (!reportingPeriod || !reportingPeriod.periodType || !reportingPeriod.year) {
      return null;
    }

    const { periodType, year } = reportingPeriod;
    let startDate, endDate;

    if (periodType === "FY") {
      // Financial Year: April 1 to March 31
      startDate = new Date(year, 3, 1); // April 1
      endDate = new Date(year + 1, 2, 31); // March 31 next year
    } else if (periodType === "CY") {
      // Calendar Year: January 1 to December 31
      startDate = new Date(year, 0, 1); // January 1
      endDate = new Date(year, 11, 31); // December 31
    } else {
      return null;
    }

    return { startDate, endDate };
  };

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

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

  useEffect(() => {
    fetchWasteEntries();
  }, [projectInfo?._id]);

  const fetchWasteEntries = async () => {
    try {
      setFetchLoading(true);
      const token = getAuthToken();
      const userId = getUserIdFromToken();
      const projectId = projectInfo?._id;

      if (!token || !userId) {
        setError("Please log in to view waste entries");
        setFetchLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append("userId", userId);
      if (projectId) {
        params.append("projectId", projectId);
      }

      const response = await fetch(`${API_URL}/api/waste-entries?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch entries");
      }

      setWasteEntries(result.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load waste entries");
    } finally {
      setFetchLoading(false);
    }
  };

  const validateEntry = () => {
    const newErrors = {};

    // Validate waste material
    if (!currentEntry.wasteMaterial.trim()) {
      newErrors.wasteMaterial = "Waste material is required";
    }

    // Validate input date
    if (!currentEntry.inputDate) {
      newErrors.inputDate = "Input date is required";
    } else {
      const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod);
      
      if (dateRange) {
        const { startDate, endDate } = dateRange;
        const inputDate = new Date(currentEntry.inputDate);
        
        // Reset time for accurate date-only comparison
        inputDate.setHours(0, 0, 0, 0);
        const compareStartDate = new Date(startDate);
        compareStartDate.setHours(0, 0, 0, 0);
        const compareEndDate = new Date(endDate);
        compareEndDate.setHours(23, 59, 59, 999);

        if (inputDate < compareStartDate || inputDate > compareEndDate) {
          const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          };
          
          newErrors.inputDate = `Date must be between ${formatDate(startDate)} and ${formatDate(endDate)}`;
        }
      }
    }

    // Validate waste data based on active tab
    const currentData = activeTab === "hazardous" 
      ? currentEntry.hazardousData 
      : currentEntry.nonHazardousData;
    
    if (!currentData.total || parseFloat(currentData.total) <= 0) {
      newErrors.total = "Total waste must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      diversionPercent:
        total > 0 ? ((diversion / total) * 100).toFixed(2) : "0.00",
    };
  };

  const handleAddEntry = async () => {
    if (!validateEntry()) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    const token = getAuthToken();
    const userId = getUserIdFromToken();
    const projectId = projectInfo?._id;

    if (!token || !userId) {
      setError("Please log in to add waste entries");
      setLoading(false);
      return;
    }

    const newEntry = {
      userId,
      projectId,
      reportingPeriod: projectInfo?.reportingPeriod || null,
      wasteMaterial: currentEntry.wasteMaterial,
      wasteHandler: currentEntry.wasteHandler || null,
      modeOfDisposal: currentEntry.modeOfDisposal || null,
      inputDate: currentEntry.inputDate,
      unit: selectedUnit,
      includeHazardous: activeTab === "hazardous",
      includeNonHazardous: activeTab === "nonHazardous",
      hazardousData: activeTab === "hazardous" ? currentEntry.hazardousData : null,
      nonHazardousData: activeTab === "nonHazardous" ? currentEntry.nonHazardousData : null,
    };

    if (activeTab === "hazardous") {
      const haz = calculateDiversion(currentEntry.hazardousData);
      newEntry.hazardousDiversion = haz.diversion;
      newEntry.hazardousDiversionPercent = haz.diversionPercent;
    }

    if (activeTab === "nonHazardous") {
      const nonHaz = calculateDiversion(currentEntry.nonHazardousData);
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

      if (!response.ok) {
        throw new Error(result.message || "Failed to save entry");
      }

      setWasteEntries((prev) => [...prev, result.data]);
      setSuccessMessage("Entry added successfully!");

      // Reset form
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
      });

      setErrors({});

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Add entry error:", err);
      setError(err.message || "Failed to save waste entry");
    } finally {
      setLoading(false);
    }
  };

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
    };
    return labels[key] || key;
  };

  const renderDisposalInputs = () => {
    const data = activeTab === "hazardous" 
      ? currentEntry.hazardousData 
      : currentEntry.nonHazardousData;
      
    const setData = (newData) => setCurrentEntry({ 
      ...currentEntry, 
      [activeTab === "hazardous" ? "hazardousData" : "nonHazardousData"]: newData 
    });

    return (
      <div className={styles.wasteDataSection}>
        <h3 className={styles.sectionTitle}>
          {activeTab === "hazardous" ? "Hazardous" : "Non-Hazardous"} Waste Disposal Data
        </h3>
        <div className={styles.formGrid}>
          {Object.keys(data).map(key => (
            <div key={key} className={styles.formGroup}>
              <label className={styles.label}>
                {getFieldLabel(key)} {key === "total" && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                className={styles.input}
                value={data[key]} 
                onChange={(e) => setData({ ...data, [key]: e.target.value })} 
              />
              {key === "total" && errors.total && (
                <span className={styles.errorText}>{errors.total}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get date range for input restrictions
  const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod);
  const minDate = dateRange?.startDate?.toISOString().split("T")[0];
  const maxDate = dateRange?.endDate?.toISOString().split("T")[0];

  return (
    <div className={styles.formContainer}>
      {/* Toolbar - Matching Excel view */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h2 className={styles.heading}>Waste Entry Form</h2>
          <span className={styles.entryCount}>
            {wasteEntries.length} total entries
          </span>
        </div>
        <div className={styles.toolbarRight}>
          {/* Future: Add more toolbar actions here if needed */}
        </div>
      </div>

      {/* Info Banner - Matching Excel view */}
      <div className={styles.infoBanner}>
        Fill in the form below to add a new waste entry. Fields marked with * are required.
      </div>

      {/* Content Wrapper - Scrollable area */}
      <div className={styles.contentWrapper}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Waste Entry Details</h3>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className={styles.successMessage}>
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Waste Material <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input 
                placeholder="e.g., Plastic, Paper, Metal" 
                className={styles.input}
                value={currentEntry.wasteMaterial} 
                onChange={(e) => setCurrentEntry({ ...currentEntry, wasteMaterial: e.target.value })} 
              />
              {errors.wasteMaterial && (
                <span className={styles.errorText}>{errors.wasteMaterial}</span>
              )}
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
              <label className={styles.label}>
                Input Date <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input 
                type="date" 
                className={styles.input}
                value={currentEntry.inputDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setCurrentEntry({ ...currentEntry, inputDate: e.target.value })} 
              />
              {errors.inputDate && (
                <span className={styles.errorText}>{errors.inputDate}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Unit <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select 
                value={selectedUnit} 
                onChange={(e) => setSelectedUnit(e.target.value)}
                className={styles.input}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Tonnes</option>
                <option value="metric_tonnes">Metric Tonnes (MT)</option>
              </select>
            </div>
          </div>

          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${activeTab === "hazardous" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("hazardous")}
            >
              Hazardous Waste
            </button>

            <button
              className={`${styles.tab} ${activeTab === "nonHazardous" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("nonHazardous")}
            >
              Non-Hazardous Waste
            </button>
          </div>

          {renderDisposalInputs()}

          <button 
            className={styles.addButton} 
            onClick={handleAddEntry} 
            disabled={loading}
          >
            <Plus size={16} /> 
            {loading ? "Saving..." : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WasteDataEntryForm;