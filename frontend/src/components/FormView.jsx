import React, { useState, useEffect } from "react";
import { Plus, AlertCircle, CheckCircle } from "lucide-react";
import styles from "../styles/FormView.module.css";

const API_URL = import.meta.env.VITE_API_KEY;

const WasteDataEntryForm = ({ projectInfo, sidebarExpanded }) => {
  const [wasteEntries, setWasteEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hazardous");

  // Separate state for hazardous waste
  const [hazardousEntry, setHazardousEntry] = useState({
    wasteMaterial: "",
    wasteHandler: "",
    modeOfDisposal: "",
    inputDate: "",
    unit: "kg",
    reuse: "",
    recycle: "",
    composting: "",
    incinerationWithHeat: "",
    incinerationWithoutHeat: "",
    landfill: "",
    exemption: "",
  });

  // Separate state for non-hazardous waste
  const [nonHazardousEntry, setNonHazardousEntry] = useState({
    wasteMaterial: "",
    wasteHandler: "",
    modeOfDisposal: "",
    inputDate: "",
    unit: "kg",
    reuse: "",
    recycle: "",
    composting: "",
    incinerationWithHeat: "",
    incinerationWithoutHeat: "",
    landfill: "",
    exemption: "",
  });

  const [errors, setErrors] = useState({});

  // Calculate total waste automatically
  const calculateTotal = (entry) => {
    const total =
      (parseFloat(entry.reuse) || 0) +
      (parseFloat(entry.recycle) || 0) +
      (parseFloat(entry.composting) || 0) +
      (parseFloat(entry.incinerationWithHeat) || 0) +
      (parseFloat(entry.incinerationWithoutHeat) || 0) +
      (parseFloat(entry.landfill) || 0) +
      (parseFloat(entry.exemption) || 0);
    
    return total.toFixed(2);
  };

  const getReportingPeriodRange = (reportingPeriod) => {
    if (!reportingPeriod || !reportingPeriod.periodType || !reportingPeriod.year) {
      return null;
    }

    const { periodType, year } = reportingPeriod;
    let startDate, endDate;

    if (periodType === "FY") {
      startDate = new Date(year, 3, 1);
      endDate = new Date(year + 1, 2, 31);
    } else if (periodType === "CY") {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
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
    const currentEntry = activeTab === "hazardous" ? hazardousEntry : nonHazardousEntry;

    if (!currentEntry.wasteMaterial.trim()) {
      newErrors.wasteMaterial = "Waste material is required";
    }

    if (!currentEntry.inputDate) {
      newErrors.inputDate = "Input date is required";
    } else {
      const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod);
      
      if (dateRange) {
        const { startDate, endDate } = dateRange;
        const inputDate = new Date(currentEntry.inputDate);
        
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

    const total = parseFloat(calculateTotal(currentEntry));
    if (total <= 0) {
      newErrors.total = "Total waste must be greater than 0. Please enter at least one disposal value.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDiversion = (entry) => {
    const total = parseFloat(calculateTotal(entry)) || 0;

    const diversion =
      (parseFloat(entry.reuse) || 0) +
      (parseFloat(entry.recycle) || 0) +
      (parseFloat(entry.composting) || 0) +
      (parseFloat(entry.incinerationWithHeat) || 0) +
      (parseFloat(entry.incinerationWithoutHeat) || 0);

    return {
      diversion: diversion.toFixed(2),
      diversionPercent: total > 0 ? ((diversion / total) * 100).toFixed(2) : "0.00",
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

    const currentEntry = activeTab === "hazardous" ? hazardousEntry : nonHazardousEntry;
    const total = calculateTotal(currentEntry);

    const wasteData = {
      total,
      reuse: currentEntry.reuse || "0",
      recycle: currentEntry.recycle || "0",
      composting: currentEntry.composting || "0",
      incinerationWithHeat: currentEntry.incinerationWithHeat || "0",
      incinerationWithoutHeat: currentEntry.incinerationWithoutHeat || "0",
      landfill: currentEntry.landfill || "0",
      exemption: currentEntry.exemption || "0",
    };

    const newEntry = {
      userId,
      projectId,
      reportingPeriod: projectInfo?.reportingPeriod || null,
      wasteMaterial: currentEntry.wasteMaterial,
      wasteHandler: currentEntry.wasteHandler || null,
      modeOfDisposal: currentEntry.modeOfDisposal || null,
      inputDate: currentEntry.inputDate,
      unit: currentEntry.unit,
      includeHazardous: activeTab === "hazardous",
      includeNonHazardous: activeTab === "nonHazardous",
      hazardousData: activeTab === "hazardous" ? wasteData : null,
      nonHazardousData: activeTab === "nonHazardous" ? wasteData : null,
    };

    if (activeTab === "hazardous") {
      const haz = calculateDiversion(currentEntry);
      newEntry.hazardousDiversion = haz.diversion;
      newEntry.hazardousDiversionPercent = haz.diversionPercent;
    } else {
      const nonHaz = calculateDiversion(currentEntry);
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

      // Reset the appropriate form
      const resetEntry = {
        wasteMaterial: "",
        wasteHandler: "",
        modeOfDisposal: "",
        inputDate: "",
        unit: "kg",
        reuse: "",
        recycle: "",
        composting: "",
        incinerationWithHeat: "",
        incinerationWithoutHeat: "",
        landfill: "",
        exemption: "",
      };

      if (activeTab === "hazardous") {
        setHazardousEntry(resetEntry);
      } else {
        setNonHazardousEntry(resetEntry);
      }

      setErrors({});
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

  const renderTabContent = () => {
    const currentEntry = activeTab === "hazardous" ? hazardousEntry : nonHazardousEntry;
    const setCurrentEntry = activeTab === "hazardous" ? setHazardousEntry : setNonHazardousEntry;
    const total = calculateTotal(currentEntry);

    const disposalFields = [
      "reuse",
      "recycle",
      "composting",
      "incinerationWithHeat",
      "incinerationWithoutHeat",
      "landfill",
      "exemption",
    ];

    return (
      <>
        {/* Common Fields for Each Tab */}
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
              <span className={styles.errorText}>
                <AlertCircle size={12} />
                {errors.wasteMaterial}
              </span>
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
              min={dateRange?.startDate?.toISOString().split("T")[0]}
              max={dateRange?.endDate?.toISOString().split("T")[0]}
              onChange={(e) => setCurrentEntry({ ...currentEntry, inputDate: e.target.value })} 
            />
            {errors.inputDate && (
              <span className={styles.errorText}>
                <AlertCircle size={12} />
                {errors.inputDate}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Unit <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select 
              value={currentEntry.unit} 
              onChange={(e) => setCurrentEntry({ ...currentEntry, unit: e.target.value })}
              className={styles.input}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="tonnes">Tonnes</option>
              <option value="metric_tonnes">Metric Tonnes (MT)</option>
            </select>
          </div>
        </div>



          <div className={styles.formGrid}>
            {/* Total Waste - Read Only */}
            <div className={`${styles.formGroup} ${styles.totalField}`}>
              <label className={styles.label}>
                Total Waste (Auto-calculated)
              </label>
              <input 
                type="text" 
                className={`${styles.input} ${styles.inputReadOnly}`}
                value={total}
                readOnly
                disabled
              />
              <span className={styles.helpText}>
                This value is automatically calculated from the disposal fields below
              </span>
              {errors.total && (
                <span className={styles.errorText}>
                  <AlertCircle size={12} />
                  {errors.total}
                </span>
              )}
            </div>

            {/* Disposal Fields */}
            {disposalFields.map(key => (
              <div key={key} className={styles.formGroup}>
                <label className={styles.label}>
                  {getFieldLabel(key)}
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  className={styles.input}
                  value={currentEntry[key]} 
                  onChange={(e) => setCurrentEntry({ ...currentEntry, [key]: e.target.value })} 
                />
              </div>
            ))}
          </div>
       
      </>
    );
  };

  const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod);

  return (
    <div className={`${styles.formContainer} ${sidebarExpanded ? styles.withExpandedSidebar : ''}`}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
         
          <span className={styles.entryCount}>
            {wasteEntries.length} total entries
          </span>
        </div>
      </div>

      {/* Info Banner */}
      {/* <div className={styles.infoBanner}>
        Fill in the form below to add a new waste entry. Switch between tabs to enter hazardous or non-hazardous waste data.
      </div> */}

      {/* Content Wrapper */}
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
        

          {/* Tabs */}
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
                    <h3 className={styles.sectionTitle}>
            Waste Disposal Data
            <span className={`${styles.sectionBadge} ${activeTab === "hazardous" ? styles.badgeHazardous : styles.badgeNonHazardous}`}>
              {activeTab === "hazardous" ? "Hazardous" : "Non-Hazardous"}
            </span>
          </h3>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Add Button */}
          <button 
            className={styles.addButton} 
            onClick={handleAddEntry} 
            disabled={loading}
          >
            <Plus size={16} /> 
            {loading ? "Saving..." : `Add ${activeTab === "hazardous" ? "Hazardous" : "Non-Hazardous"} Entry`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WasteDataEntryForm;