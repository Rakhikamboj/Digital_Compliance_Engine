import { Calendar } from "lucide-react";
import { useState } from "react";
import styles from "../styles/ReportingPeriod.module.css";

const API_URL = "http://localhost:5001/api/reporting-period";


const ReportingPeriod = ({
  reportingPeriod,
  setReportingPeriod,
  onNext
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token"); // JWT

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          periodType: reportingPeriod.periodType,
          year: reportingPeriod.year
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save reporting period");
      }

      console.log("Reporting period saved:", data);
      onNext(data.data);
    } catch (err) {
      console.error("Error saving reporting period:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.heading}>
              <Calendar size={18} />
              Reporting Period
            </h2>
          </div>

          {/* Period Type */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Period Type</label>
            <select
              className={styles.select}
              value={reportingPeriod.periodType}
              onChange={(e) =>
                setReportingPeriod({
                  ...reportingPeriod,
                  periodType: e.target.value,
                  year:
                    e.target.value === "financial"
                      ? "2024-25"
                      : "2025"
                })
              }
            >
              <option value="financial">Financial Year</option>
              <option value="calendar">Calendar Year</option>
            </select>
          </div>

          {/* Year */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {reportingPeriod.periodType === "financial"
                ? "Financial Year"
                : "Calendar Year"}
            </label>

            <select
              className={styles.select}
              value={reportingPeriod.year}
              onChange={(e) =>
                setReportingPeriod({
                  ...reportingPeriod,
                  year: e.target.value
                })
              }
            >
              {reportingPeriod.periodType === "financial" ? (
                <>
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2022-23">2022-23</option>
                  <option value="2025-26">2025-26</option>
                </>
              ) : (
                <>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2026">2026</option>
                </>
              )}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            className={styles.primaryBtn}
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue to Data Entry"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default ReportingPeriod;
