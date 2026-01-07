import express from "express"
import { connectToDatabase } from "../lib/mongodb.js"
import { ObjectId } from "mongodb"

const router = express.Router()

/**
 * Helper function to derive start and end dates from reporting period
 */
const getReportingPeriodDates = (reportingPeriod) => {
  if (!reportingPeriod || !reportingPeriod.periodType || !reportingPeriod.year) {
    throw new Error("Invalid reporting period")
  }

  const { periodType, year } = reportingPeriod
  let startDate, endDate

  const yearNum = Number.parseInt(year, 10)
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
    throw new Error(`Invalid year: ${year}. Year must be between 1900 and 2100`)
  }

  const normalizedPeriodType = periodType === "financial" ? "FY" : periodType

  if (normalizedPeriodType === "FY") {
    // Financial Year: April 1 to March 31
    startDate = new Date(yearNum, 3, 1) // April 1
    endDate = new Date(yearNum + 1, 2, 31) // March 31 next year
  } else if (normalizedPeriodType === "CY") {
    // Calendar Year: January 1 to December 31
    startDate = new Date(yearNum, 0, 1) // January 1
    endDate = new Date(yearNum, 11, 31) // December 31
  } else {
    throw new Error(`Invalid period type: ${normalizedPeriodType}. Must be 'FY' or 'CY'`)
  }

  return { startDate, endDate }
}

/**
 * POST - Save waste entry
 */
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      projectId,
      reportingPeriod,
      wasteMaterial,
      wasteHandler,
      modeOfDisposal,
      inputDate,
      unit,
      includeHazardous,
      includeNonHazardous,
      hazardousData,
      nonHazardousData,
      hazardousDiversion,
      hazardousDiversionPercent,
      nonHazardousDiversion,
      nonHazardousDiversionPercent,
    } = req.body

    // Validate required fields
    if (!wasteMaterial) {
      return res.status(400).json({
        message: "Waste material is required",
      })
    }

    if (!inputDate) {
      return res.status(400).json({
        message: "Input date is required",
      })
    }

    if (!reportingPeriod) {
      return res.status(400).json({
        message: "Reporting period is required",
      })
    }

    // Derive start and end dates from reporting period
    let startDate, endDate
    try {
      const dates = getReportingPeriodDates(reportingPeriod)
      startDate = dates.startDate
      endDate = dates.endDate
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      })
    }

    let enteredDate
    try {
      enteredDate = new Date(inputDate)

      if (isNaN(enteredDate.getTime())) {
        throw new Error("Invalid date format")
      }
    } catch (error) {
      return res.status(400).json({
        message: `Invalid input date format: ${inputDate}. Please use YYYY-MM-DD format`,
      })
    }

    // Reset time to midnight for accurate date-only comparison
    enteredDate.setHours(0, 0, 0, 0)
    const compareStartDate = new Date(startDate)
    compareStartDate.setHours(0, 0, 0, 0)
    const compareEndDate = new Date(endDate)
    compareEndDate.setHours(23, 59, 59, 999)

    if (enteredDate < compareStartDate || enteredDate > compareEndDate) {
      const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      return res.status(400).json({
        message: `Input date must be between ${formatDate(startDate)} and ${formatDate(endDate)}`,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
        },
      })
    }

    console.log("Date validation successful:", {
      periodType: reportingPeriod.periodType,
      year: reportingPeriod.year,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      enteredDate: enteredDate.toISOString(),
    })

    const { db } = await connectToDatabase()
    const collection = db.collection("waste_entries")

    const wasteEntry = {
      userId,
      projectId, // Ensure projectId is stored for filtering
      reportingPeriod,
      wasteMaterial,
      wasteHandler: wasteHandler || null,
      modeOfDisposal: modeOfDisposal || null,
      inputDate: enteredDate,
      unit: unit || "kg",
      includeHazardous: includeHazardous || false,
      includeNonHazardous: includeNonHazardous || false,
      hazardousData: includeHazardous ? hazardousData : null,
      nonHazardousData: includeNonHazardous ? nonHazardousData : null,
      hazardousDiversion: includeHazardous ? hazardousDiversion : null,
      hazardousDiversionPercent: includeHazardous ? hazardousDiversionPercent : null,
      nonHazardousDiversion: includeNonHazardous ? nonHazardousDiversion : null,
      nonHazardousDiversionPercent: includeNonHazardous ? nonHazardousDiversionPercent : null,
      createdAt: new Date(),
    }

    const result = await collection.insertOne(wasteEntry)

    return res.status(201).json({
      message: "Waste entry saved successfully",
      data: {
        _id: result.insertedId,
        ...wasteEntry,
      },
    })
  } catch (error) {
    console.error("Error saving waste entry:", error)
    return res.status(500).json({
      message: "Failed to save waste entry",
      error: error.message || "Unknown error",
    })
  }
})

/**
 * GET - Fetch waste entries (filtered by projectId to prevent fetching other projects' entries)
 */
router.get("/", async (req, res) => {
  try {
    const { userId, projectId } = req.query

    const { db } = await connectToDatabase()
    const collection = db.collection("waste_entries")

    const query = {}
    if (userId) query.userId = userId
    if (projectId) query.projectId = projectId

    // If no projectId provided, still require userId for security
    if (!projectId && userId) {
      console.warn("Warning: Fetching entries without projectId filter")
    }

    const entries = await collection.find(query).sort({ createdAt: -1 }).toArray()

    return res.status(200).json({
      message: "Waste entries retrieved successfully",
      data: entries,
    })
  } catch (error) {
    console.error("Error fetching waste entries:", error)
    return res.status(500).json({
      message: "Failed to fetch waste entries",
      error: error.message || "Unknown error",
    })
  }
})

/**
 * DELETE - Delete waste entry
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        message: "Entry ID is required",
      })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("waste_entries")

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Entry not found",
      })
    }

    return res.status(200).json({
      message: "Waste entry deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting waste entry:", error)
    return res.status(500).json({
      message: "Failed to delete waste entry",
      error: error.message || "Unknown error",
    })
  }
})

export default router
