import { useState } from "react";
import {
  Filter,
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
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [filterMaterial, setFilterMaterial] = useState("all");

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

  const sortedEntries = getSortedEntries();
  const groupedEntries = groupEntriesByMonth();
  const recentEntries = sortedEntries.slice(0, 3);
  const uniqueMaterials = getUniqueMaterials();

  return (
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
                        {new Date(entry.inputDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        - {entry.wasteMaterial}
                      </span>
                      <span
                        className={`${styles.badge} ${
                          entry.includeHazardous
                            ? styles.badgeHazardous
                            : styles.badgeNonHazardous
                        }`}
                      >
                        {entry.includeHazardous ? "Hazardous" : "Non-Hazardous"}
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
                              <td className={styles.unitCell}>{entry.unit}</td>
                              <td className={styles.actionCell}>
                                <button
                                  className={styles.deleteButton}
                                  onClick={() => onDeleteEntry(entry._id)}
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
          <button className={styles.submitButton} onClick={onSubmitEntries}>
            Submit All Entries
          </button>
        </div>
      )}
    </div>
  );
};

export default WasteEntrySidebar;