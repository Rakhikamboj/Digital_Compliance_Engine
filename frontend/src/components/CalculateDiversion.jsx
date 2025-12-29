import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import styles from "../styles/WasteDataEntry.module.css";

const API_URL = "http://localhost:5001/api/waste-entries";

const WasteDataEntry = ({ onNext, reportingPeriodId }) => {
  const [wasteEntries, setWasteEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);

  const [currentEntry, setCurrentEntry] = useState({
    wasteMaterial: "",
    wasteHandler: "",
    modeOfDisposal: "",
    inputDate: "",
    includeHazardous: false,
    includeNonHazardous: false,
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

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Get user ID from token
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
  }, [reportingPeriodId]);

  const fetchWasteEntries = async () => {
    try {
      setFetchLoading(true);
      const token = getAuthToken();
      const userId = getUserIdFromToken();

      if (!token || !userId) {
        setError("Please log in to view waste entries");
        return;
      }

      const params = new URLSearchParams();
      params.append("userId", userId);
      if (reportingPeriodId) {
        params.append("reportingPeriodId", reportingPeriodId);
      }

      const response = await fetch(`${API_URL}?${params.toString()}`, {
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

  /* ---------------- Validation ---------------- */
  const validateEntry = () => {
    const newErrors = {};

    if (!currentEntry.wasteMaterial.trim()) {
      newErrors.wasteMaterial = "Waste material is required";
    }

    if (!currentEntry.includeHazardous && !currentEntry.includeNonHazardous) {
      newErrors.wasteType = "Please select at least one waste type";
    }

    if (currentEntry.includeHazardous && !currentEntry.hazardousData.total) {
      newErrors.hazardousTotal = "Hazardous waste total is required";
    }

    if (
      currentEntry.includeNonHazardous &&
      !currentEntry.nonHazardousData.total
    ) {
      newErrors.nonHazardousTotal = "Non-hazardous waste total is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Diversion Calculation ---------------- */
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

  /* ---------------- Add Entry (API) ---------------- */
  const handleAddEntry = async () => {
    if (!validateEntry()) return;

    setLoading(true);
    setError("");

    const token = getAuthToken();
    const userId = getUserIdFromToken();

    if (!token || !userId) {
      setError("Please log in to add waste entries");
      setLoading(false);
      return;
    }

    const newEntry = {
      userId,
      reportingPeriodId: reportingPeriodId || null,
      wasteMaterial: currentEntry.wasteMaterial,
      wasteHandler: currentEntry.wasteHandler || null,
      modeOfDisposal: currentEntry.modeOfDisposal || null,
      inputDate: currentEntry.inputDate || null,
      includeHazardous: currentEntry.includeHazardous,
      includeNonHazardous: currentEntry.includeNonHazardous,
      hazardousData: currentEntry.includeHazardous
        ? currentEntry.hazardousData
        : null,
      nonHazardousData: currentEntry.includeNonHazardous
        ? currentEntry.nonHazardousData
        : null,
    };

    if (currentEntry.includeHazardous) {
      const haz = calculateDiversion(currentEntry.hazardousData);
      newEntry.hazardousDiversion = haz.diversion;
      newEntry.hazardousDiversionPercent = haz.diversionPercent;
    }

    if (currentEntry.includeNonHazardous) {
      const nonHaz = calculateDiversion(currentEntry.nonHazardousData);
      newEntry.nonHazardousDiversion = nonHaz.diversion;
      newEntry.nonHazardousDiversionPercent = nonHaz.diversionPercent;
    }

    try {
      const response = await fetch(API_URL, {
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

      // Add the returned entry to state
      setWasteEntries((prev) => [...prev, result.data]);

      /* Reset form */
      setCurrentEntry({
        wasteMaterial: "",
        wasteHandler: "",
        modeOfDisposal: "",
        inputDate: "",
        includeHazardous: false,
        includeNonHazardous: false,
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

  /* ---------------- Delete Entry (API) ---------------- */
  const handleDeleteEntry = async (id) => {
    const token = getAuthToken();

    if (!token) {
      setError("Please log in to delete entries");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
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

  /* ---------------- Field Labels ---------------- */
  const getFieldLabel = (key) => {
    const labels = {
      total: "Total",
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

  /* ---------------- Disposal Inputs ---------------- */
  const renderDisposalInputs = (type) => {
    const isHaz = type === "hazardous";
    const data = isHaz
      ? currentEntry.hazardousData
      : currentEntry.nonHazardousData;

    const setData = (newData) =>
      setCurrentEntry({
        ...currentEntry,
        [isHaz ? "hazardousData" : "nonHazardousData"]: newData,
      });

    return (
      <div className={styles.disposalBox}>
        <h3 className={styles.subHeading}>
          {isHaz ? "Hazardous" : "Non-Hazardous"} Waste Data
        </h3>

        <div className={styles.grid}>
          {Object.keys(data).map((key) => (
            <div key={key}>
              <label className={styles.label}>
                {getFieldLabel(key)} (kg)
                {key === "total" && " *"}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className={styles.input}
                value={data[key]}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
              {key === "total" && isHaz && errors.hazardousTotal && (
                <span className={styles.errorText}>
                  {errors.hazardousTotal}
                </span>
              )}
              {key === "total" && !isHaz && errors.nonHazardousTotal && (
                <span className={styles.errorText}>
                  {errors.nonHazardousTotal}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ---------------- JSX ---------------- */
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ADD FORM */}
        <div className={styles.card}>
          <h2 className={styles.heading}>Add Waste Entry</h2>

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.grid}>
            <div>
              <label className={styles.label}>Waste Material *</label>
              <input
                placeholder="e.g., Plastic, Paper, Metal, E-waste"
                className={`${styles.input} ${
                  errors.wasteMaterial ? styles.inputError : ""
                }`}
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

            <div>
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

            <div>
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

            <div>
              <label className={styles.label}>Input Date</label>
              <input
                type="date"
                className={styles.input}
                value={currentEntry.inputDate}
                onChange={(e) =>
                  setCurrentEntry({
                    ...currentEntry,
                    inputDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={currentEntry.includeHazardous}
                onChange={(e) =>
                  setCurrentEntry({
                    ...currentEntry,
                    includeHazardous: e.target.checked,
                  })
                }
              />
              Include Hazardous Waste Data
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={currentEntry.includeNonHazardous}
                onChange={(e) =>
                  setCurrentEntry({
                    ...currentEntry,
                    includeNonHazardous: e.target.checked,
                  })
                }
              />
              Include Non-Hazardous Waste Data
            </label>
          </div>

          {errors.wasteType && (
            <span className={styles.errorText}>{errors.wasteType}</span>
          )}

          {currentEntry.includeHazardous && renderDisposalInputs("hazardous")}
          {currentEntry.includeNonHazardous &&
            renderDisposalInputs("nonHazardous")}

          <button
            className={styles.primaryBtn}
            onClick={handleAddEntry}
            disabled={loading}
          >
            <Plus size={16} />
            {loading ? "Saving..." : "Add Entry"}
          </button>
        </div>

        {/* TABLE */}
        {fetchLoading ? (
          <div className={styles.card}>
            <p>Loading entries...</p>
          </div>
        ) : wasteEntries.length > 0 ? (
          <div className={styles.card}>
            <h3 className={styles.heading}>
              Entered Waste Data ({wasteEntries.length})
            </h3>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.alignHeading}>Material</th>
                      <th className={styles.alignHeading}>Handler</th>
                      <th className={styles.alignHeading}>Type</th>
                      <th className={styles.alignHeading}>Total (kg)</th>
                      <th className={styles.alignHeading}>Diversion %</th>
                      <th className={styles.alignHeading}>Action</th>
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
                          <td>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteEntry(entry._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )}

                      {entry.includeNonHazardous && (
                        <tr>
                          <td>{entry.wasteMaterial}</td>
                          <td>{entry.wasteHandler || "—"}</td>
                          <td>Non-Hazardous</td>
                          <td>{entry.nonHazardousData?.total || "—"}</td>
                          <td>{entry.nonHazardousDiversionPercent || "0"}%</td>
                          <td>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteEntry(entry._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className={styles.primaryBtn}
              onClick={() => onNext(wasteEntries)}
            >
              View Compliance Dashboard
            </button>
          </div>
        ) : (
          <div className={styles.card}>
            <p style={{ textAlign: "center", color: "#7f8c8d" }}>
              No waste entries yet. Add your first entry above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteDataEntry;