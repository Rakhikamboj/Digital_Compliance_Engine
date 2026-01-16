import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from "lucide-react";
import styles from "../styles/WasteDataEntry.module.css";

const WasteEntrySidebar = ({
  projectInfo,
  wasteEntries,
  fetchLoading,
  onBackToProjects,
  onDeleteEntry,
  onSubmitEntries,
  onShowDashboard, // NEW: Callback to show dashboard
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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

  const groupedEntries = groupEntriesByMonth();

  // Get project name initial
  const projectInitial = projectInfo?.projectName?.charAt(0)?.toUpperCase() || "P";
  
  // Get admin name initial (replace with actual admin data)
  const adminName = "Admin"; // Replace with actual admin name from props/context
  const adminInitial = adminName.charAt(0).toUpperCase();

  const handleToggle = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div
      className={`${styles.sidebar} ${
        sidebarExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed
      }`}
    >
      {/* Collapsed State (80px) */}
      {!sidebarExpanded && (
        <div className={styles.collapsedContent}>
          {/* Back to Projects Button */}
          <div
            onClick={onBackToProjects}
            className={styles.backButton}
            aria-label="Back to projects"
            title="Back to Projects"
          >
            <ArrowLeft size={20} />
          </div>

          {/* Project Initial */}
          <div className={styles.projectInitial} title={projectInfo?.projectName || "Project"}>
            {projectInitial}
          </div>

          {/* Dashboard Navigation */}
          <button
            className={styles.dashboardNavButton} 
            onClick={onShowDashboard} // UPDATED: Use callback instead of local state
            title="Open Dashboard"
          >
            <LayoutDashboard size={24} />
          </button>

          {/* Bottom Section */}
          <div className={styles.sidebarBottom}>
            {/* Toggle Expand Button */}
            <button
              onClick={handleToggle}
              className={styles.toggleButton}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronsRight size={20} />
            </button>

            {/* Admin Initial */}
            <div className={styles.adminInitial} title={adminName}>
              {adminInitial}
            </div>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {sidebarExpanded && (
        <div className={styles.expandedContent}>
          {/* Header with Toggle */}
          <div className={styles.expandedHeader}>
            <div className={styles.headerTopRow}>
              <div
                onClick={onBackToProjects}
                className={styles.backToProjectsBtn}
                aria-label="Back to projects"
                title="Back to Projects"
              >
                <ArrowLeft size={18} />
              </div>
              <div className={styles.projectInfo}>
                <h2 className={styles.projectName}>
                  {projectInfo?.projectName || "Project Name"}
                </h2>
              </div>
            </div>
            <div className={styles.projectMeta}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Period:</span>
                <span className={styles.metaValue}>
                  {projectInfo?.reportingPeriod?.periodType || "FY"} - {projectInfo?.reportingPeriod?.year || "2024"}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Client:</span>
                <span className={styles.metaValue}>
                  {projectInfo?.clientName || "Client Name"}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className={styles.toggleButtonExpanded}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronsLeft size={24} />
            </button>
          </div>

          {/* Waste Entries Table */}
          <div className={styles.entriesContainer}>
            <h3 className={styles.entriesTitle}>Waste Entries</h3>
            
            {fetchLoading ? (
              <div className={styles.loadingState}>Loading entries...</div>
            ) : Object.keys(groupedEntries).length === 0 ? (
              <div className={styles.emptyState}>No entries yet</div>
            ) : (
              <div className={styles.monthGroups}>
                {Object.entries(groupedEntries).map(([monthKey, entries]) => (
                  <div key={monthKey} className={styles.monthGroup}>
                    <div className={styles.monthHeader}>
                      {monthKey} <span className={styles.entryCount}>({entries.length})</span>
                    </div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.entriesTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Material</th>
                            <th>Type</th>
                            <th>Handler</th>
                            <th>Total</th>
                            <th>Unit</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => (
                            <tr key={entry._id}>
                              <td>
                                {new Date(entry.inputDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </td>
                              <td>{entry.wasteMaterial}</td>
                              <td>
                                <span
                                  className={
                                    entry.includeHazardous
                                      ? styles.badgeHazardous
                                      : styles.badgeNonHazardous
                                  }
                                >
                                  {entry.includeHazardous ? "H" : "NH"}
                                </span>
                              </td>
                              <td>{entry.wasteHandler || "—"}</td>
                              <td>
                                {entry.includeHazardous
                                  ? entry.hazardousData?.total
                                  : entry.nonHazardousData?.total}
                              </td>
                              <td>{entry.unit}</td>
                              <td>
                                <button
                                  onClick={() => onDeleteEntry(entry._id)}
                                  className={styles.deleteBtn}
                                  aria-label="Delete entry"
                                  title="Delete entry"
                                >
                                  <Trash2 size={16} />
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

          {/* Submit Button Footer */}
          {wasteEntries.length > 0 && (
            <div className={styles.expandedFooter}>
              <button onClick={onSubmitEntries} className={styles.submitButton}>
                Submit All Entries
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WasteEntrySidebar;