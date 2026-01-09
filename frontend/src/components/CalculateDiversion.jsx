import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  BarChart3,
  ChevronsRight,
  ChevronsLeft,
  Filter,
  ArrowLeft,
} from "lucide-react";
import styles from "../styles/WasteDataEntry.module.css";
import ComplianceDashboard from "../pages/Dashboard";

const API_URL = import.meta.env.VITE_API_KEY;

const WasteDataEntry = ({ onNext, projectInfo, onBackToProjects }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [wasteEntries, setWasteEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hazardous");
  const [selectedUnit, setSelectedUnit] = useState("kg");
  const [fieldErrors, setFieldErrors] = useState({});
  const [sortBy, setSortBy] = useState("date");
  const [filterMaterial, setFilterMaterial] = useState("all");

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

  const getReportingPeriodRange = (reportingPeriod) => {
    if (
      !reportingPeriod ||
      !reportingPeriod.periodType ||
      !reportingPeriod.year
    ) {
      return null;
    }

    const { periodType, year } = reportingPeriod;
    let startDate, endDate;

    const yearNum = Number.parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return null;
    }

    const normalizedPeriodType = periodType === "financial" ? "FY" : periodType;

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

      const response = await fetch(
        `${API_URL}/api/waste-entries?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          };

          newErrors.inputDate = `Date must be between ${formatDate(
            startDate
          )} and ${formatDate(endDate)}`;
        }
      }
    }

    const currentData =
      activeTab === "hazardous"
        ? currentEntry.hazardousData
        : currentEntry.nonHazardousData;

    if (!currentData.total || Number.parseFloat(currentData.total) <= 0) {
      newErrors.total = "Total waste must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDiversion = (data) => {
    const total = Number.parseFloat(data.total) || 0;

    const diversion =
      (Number.parseFloat(data.reuse) || 0) +
      (Number.parseFloat(data.recycle) || 0) +
      (Number.parseFloat(data.composting) || 0) +
      (Number.parseFloat(data.incinerationWithHeat) || 0) +
      (Number.parseFloat(data.incinerationWithoutHeat) || 0);

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
    setFieldErrors({});

    const token = getAuthToken();
    const userId = getUserIdFromToken();
    const projectId = projectInfo?._id;

    if (!token || !userId) {
      setError("Please log in to add waste entries");
      setLoading(false);
      return;
    }

    const reportingPeriod = projectInfo?.reportingPeriod;
    const normalizedReportingPeriod = {
      ...reportingPeriod,
      periodType:
        reportingPeriod?.periodType === "financial"
          ? "FY"
          : reportingPeriod?.periodType,
    };

    const inputDateObj = new Date(currentEntry.inputDate);
    const isoInputDate = inputDateObj.toISOString().split("T")[0];

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
      hazardousData:
        activeTab === "hazardous" ? currentEntry.hazardousData : null,
      nonHazardousData:
        activeTab === "nonHazardous" ? currentEntry.nonHazardousData : null,
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
        if (result.message && result.message.includes("date")) {
          setFieldErrors({ inputDate: result.message });
        } else {
          setError(result.message || "Failed to save entry");
        }
        throw new Error(result.message || "Failed to save entry");
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
          });
        } catch (statusError) {
          console.error("Error updating project status:", statusError);
        }
      }

      setWasteEntries((prev) => [...prev, result.data]);

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
    } catch (err) {
      console.error("Add entry error:", err);
      setError(err.message || "Failed to save waste entry");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEntries = async () => {
    const token = getAuthToken();
    const projectId = projectInfo?._id;

    if (!token || !projectId) {
      setError("Please log in to submit entries");
      return;
    }

    if (wasteEntries.length === 0) {
      setError("Please add at least one waste entry before submitting");
      return;
    }

    try {
      await fetch(`${API_URL}/api/auditor/projects/${projectId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "Completed" }),
      });

      if (onNext) {
        onNext(wasteEntries);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit entries");
    }
  };

  const handleDeleteEntry = async (id) => {
    const token = getAuthToken();

    if (!token) {
      setError("Please log in to delete entries");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/waste-entries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete entry");
      }

      setWasteEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete entry");
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
    const data =
      activeTab === "hazardous"
        ? currentEntry.hazardousData
        : currentEntry.nonHazardousData;

    const setData = (newData) =>
      setCurrentEntry({
        ...currentEntry,
        [activeTab === "hazardous" ? "hazardousData" : "nonHazardousData"]:
          newData,
      });

    return (
      <div className={styles.wasteDataSection}>
        <h3 className={styles.sectionTitle}>
          {activeTab === "hazardous" ? "Hazardous" : "Non-Hazardous"} Waste
          Disposal Data
        </h3>
        <div className={styles.disposalGrid}>
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
              {key === "total" && errors.total && (
                <span className={styles.errorText}>{errors.total}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const groupEntriesByMonth = () => {
    const grouped = {};

    wasteEntries.forEach((entry) => {
      const date = new Date(entry.inputDate);
      const monthKey = `${date.toLocaleString("en-US", {
        month: "long",
      })} ${date.getFullYear()}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(entry);
    });

    return grouped;
  };

  const getSortedEntries = () => {
    let sorted = [...wasteEntries];

    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => new Date(b.inputDate) - new Date(a.inputDate));
        break;
      case "material":
        sorted.sort((a, b) => a.wasteMaterial.localeCompare(b.wasteMaterial));
        break;
      case "quantity":
        sorted.sort((a, b) => {
          const totalA = Number.parseFloat(
            a.hazardousData?.total || a.nonHazardousData?.total || 0
          );
          const totalB = Number.parseFloat(
            b.hazardousData?.total || b.nonHazardousData?.total || 0
          );
          return totalB - totalA;
        });
        break;
      default:
        break;
    }

    if (filterMaterial !== "all") {
      sorted = sorted.filter((entry) =>
        entry.wasteMaterial.toLowerCase().includes(filterMaterial.toLowerCase())
      );
    }

    return sorted;
  };

  const getUniqueMaterials = () => {
    const materials = new Set(wasteEntries.map((entry) => entry.wasteMaterial));
    return Array.from(materials);
  };

  const dateRange = getReportingPeriodRange(projectInfo?.reportingPeriod);
  const minDate = dateRange?.startDate
    ? dateRange.startDate.toISOString().split("T")[0]
    : "";
  const maxDate = dateRange?.endDate
    ? dateRange.endDate.toISOString().split("T")[0]
    : "";

  const sortedEntries = getSortedEntries();
  const groupedEntries = groupEntriesByMonth();
  const recentEntries = sortedEntries.slice(0, 3);
  const uniqueMaterials = getUniqueMaterials();

  if (showDashboard) {
    return (
      <div className={styles.dashboardContainer}>
        <button
          onClick={() => setShowDashboard(false)}
          className={styles.backButton}
        >
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
      <div
        className={`${styles.sidebar} ${
          sidebarExpanded ? styles.sidebarExpanded : ""
        }`}
      >
        {/* Project Info Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.headerTopRow}>
            <button
              onClick={onBackToProjects}
              className={styles.backToProjectsBtn}
              aria-label="Back to projects"
              title="Back to Projects"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 className={styles.projectName}>
              {projectInfo?.projectName || "Project Name"}
            </h3>
          </div>
          <div className={styles.projectMeta}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Period : </span>
              <span className={styles.metaValue}>
                {projectInfo?.reportingPeriod?.periodType || "FY"} -{" "}
                {projectInfo?.reportingPeriod?.year || "2024"}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Client :</span>
              <span className={styles.metaValue}>
                {projectInfo?.clientName || "Client Name"}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <div
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className={styles.toggleButton}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarExpanded ? (
            <ChevronsLeft size={22} />
          ) : (
            <ChevronsRight size={22} />
          )}
        </div>

        {!sidebarExpanded ? (
          <>
            {/* Recent Entries */}
            <div className={styles.sidebarSection}>
              <h4 className={styles.sectionHeading}>Recent Entries</h4>
              {fetchLoading ? (
                <div className={styles.loadingState}>Loading...</div>
              ) : recentEntries.length === 0 ? (
                <div className={styles.emptyState}>No entries yet</div>
              ) : (
                <div className={styles.recentEntriesList}>
                  {recentEntries.map((entry) => (
                    <div key={entry._id} className={styles.recentEntryCard}>
                      <div className={styles.recentEntryHeader}>
                        <span className={styles.recentEntryDate}>
                          {new Date(entry.inputDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          - {entry.wasteMaterial}
                        </span>
                        <span
                          className={`${styles.badge} ${
                            entry.includeHazardous
                              ? styles.badgeHazardous
                              : styles.badgeNonHazardous
                          }`}
                        >
                          {entry.includeHazardous
                            ? "Hazardous"
                            : "Non-Hazardous"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sort By */}
            <div className={styles.sidebarSection}>
              <div className={styles.sectionHeadingWithIcon}>
                <Filter size={15} />
                <h4 className={styles.sectionHeading}>Sort By</h4>
              </div>
              <div className={styles.sortButtons}>
                <button
                  className={`${styles.sortButton} ${
                    sortBy === "date" ? styles.sortButtonActive : ""
                  }`}
                  onClick={() => setSortBy("date")}
                >
                  Date
                </button>
                <button
                  className={`${styles.sortButton} ${
                    sortBy === "material" ? styles.sortButtonActive : ""
                  }`}
                  onClick={() => setSortBy("material")}
                >
                  Material
                </button>
              </div>
            </div>

            {/* All Entries Summary */}
            <div className={styles.allEntriesSection}>
              <h4 className={styles.sectionHeading}>All Entries</h4>
              {fetchLoading ? (
                <div className={styles.loadingState}>Loading...</div>
              ) : Object.keys(groupedEntries).length === 0 ? (
                <div className={styles.emptyState}>No entries yet</div>
              ) : (
                <div className={styles.monthGroupsList}>
                  {Object.entries(groupedEntries).map(([monthKey, entries]) => (
                    <div key={monthKey} className={styles.monthGroupCompact}>
                      <div className={styles.monthHeaderCompact}>
                        {monthKey} ({entries.length})
                      </div>
                      <div className={styles.monthEntriesCompact}>
                        {entries.map((entry) => (
                          <div key={entry._id} className={styles.compactEntry}>
                            <span className={styles.compactEntryText}>
                              {new Date(entry.inputDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}{" "}
                              - {entry.wasteMaterial}
                            </span>
                            <span
                              className={`${styles.badgeSmall} ${
                                entry.includeHazardous
                                  ? styles.badgeHazardous
                                  : styles.badgeNonHazardous
                              }`}
                            >
                              {entry.includeHazardous ? "H" : "NH"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Sort Filters - Expanded */}
            <div className={styles.sortFiltersExpanded}>
              <div className={styles.filterGroup}>
                <Filter size={16} />
                <span className={styles.filterLabel}>Sort By</span>
                <select
                  className={styles.filterSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date</option>
                  <option value="material">Material</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterMaterial}
                  onChange={(e) => setFilterMaterial(e.target.value)}
                >
                  <option value="all">All Materials</option>
                  {uniqueMaterials.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expanded Table View */}
            <div className={styles.expandedTableContainer}>
              <h4 className={styles.sectionHeading}>All Entries</h4>
              {fetchLoading ? (
                <div className={styles.loadingState}>Loading entries...</div>
              ) : Object.keys(groupedEntries).length === 0 ? (
                <div className={styles.emptyState}>No entries yet</div>
              ) : (
                <div className={styles.tableGroupsList}>
                  {Object.entries(groupedEntries).map(([monthKey, entries]) => (
                    <div key={monthKey} className={styles.tableMonthGroup}>
                      <div className={styles.monthHeaderTable}>
                        {monthKey} ({entries.length})
                      </div>
                      <div className={styles.tableWrapper}>
                        <table className={styles.entriesTable}>
                          <thead>
                            <tr>
                              <th>Input Date</th>
                              <th>Material</th>
                              <th>Type</th>
                              <th>Handler</th>
                              <th>Total</th>
                              <th>Units</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entries.map((entry) => (
                              <tr key={entry._id}>
                                <td className={styles.dateCell}>
                                  {new Date(entry.inputDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </td>
                                <td className={styles.materialCell}>
                                  {entry.wasteMaterial}
                                </td>
                                <td>
                                  <span
                                    className={`${styles.badge} ${
                                      entry.includeHazardous
                                        ? styles.badgeHazardous
                                        : styles.badgeNonHazardous
                                    }`}
                                  >
                                    {entry.includeHazardous
                                      ? "Hazardous"
                                      : "Non-Hazardous"}
                                  </span>
                                </td>
                                <td className={styles.handlerCell}>
                                  {entry.wasteHandler || "—"}
                                </td>
                                <td className={styles.totalCell}>
                                  {entry.includeHazardous
                                    ? entry.hazardousData?.total
                                    : entry.nonHazardousData?.total}
                                </td>
                                <td className={styles.unitCell}>
                                  {entry.unit}
                                </td>
                                <td className={styles.actionCell}>
                                  <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDeleteEntry(entry._id)}
                                    aria-label="Delete entry"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Submit Button - Footer */}
        {wasteEntries.length > 0 && (
          <div className={styles.sidebarFooter}>
            <button
              className={styles.submitButton}
              onClick={handleSubmitEntries}
            >
              Submit All Entries
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top Bar */}

        {/* Entry Form */}
        <div className={styles.formContainer}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Add Waste Entry</h2>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Waste Material *</label>
                <input
                  placeholder="e.g., Plastic, Paper, Metal"
                  className={styles.input}
                  value={currentEntry.wasteMaterial}
                  onChange={(e) =>
                    setCurrentEntry({
                      ...currentEntry,
                      wasteMaterial: e.target.value,
                    })
                  }
                />
                {errors.wasteMaterial && (
                  <span className={styles.errorText}>
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
                  onChange={(e) =>
                    setCurrentEntry({
                      ...currentEntry,
                      wasteHandler: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mode of Disposal</label>
                <input
                  placeholder="e.g., Recycling center, Landfill"
                  className={styles.input}
                  value={currentEntry.modeOfDisposal}
                  onChange={(e) =>
                    setCurrentEntry({
                      ...currentEntry,
                      modeOfDisposal: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setCurrentEntry({
                      ...currentEntry,
                      inputDate: e.target.value,
                    })
                  }
                />
                {errors.inputDate && (
                  <span className={styles.errorText}>{errors.inputDate}</span>
                )}
                {fieldErrors.inputDate && (
                  <span className={styles.errorText}>
                    {fieldErrors.inputDate}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Unit *</label>
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
                className={`${styles.tab} ${
                  activeTab === "hazardous" ? styles.tabActive : ""
                }`}
                onClick={() => setActiveTab("hazardous")}
              >
                Hazardous Waste
              </button>
              <button
                className={`${styles.tab} ${
                  activeTab === "nonHazardous" ? styles.tabActive : ""
                }`}
                onClick={() => setActiveTab("nonHazardous")}
              >
                Non-Hazardous Waste
              </button>
            </div>

            {renderDisposalInputs()}
            <div className={styles.bottomWasteButtons}>
              <button
                className={styles.addButton}
                onClick={handleAddEntry}
                disabled={loading}
              >
                <Plus size={16} />
                {loading ? "Saving..." : "Save Entry"}
              </button>
              <button
                onClick={() => setShowDashboard(true)}
                className={styles.dashboardButton}
              >
                <BarChart3 size={16} />
                View Compliance Dashboard
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteDataEntry;
