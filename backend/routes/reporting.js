import express from "express"
import { connectToDatabase } from "../lib/mongodb.js"
import { verifyToken } from "../middleware/auth.js"
import { ObjectId } from "../lib/mongodb.js"

const router = express.Router()

/**
 * POST - Create Reporting Period
 * Protected Route
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { periodType, year } = req.body
    const userId = req.user.id

    if (!periodType || !year) {
      return res.status(400).json({
        message: "Period type and year are required",
      })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("reporting_periods")

    // Optional: prevent duplicate period for same year + type
    const existing = await collection.findOne({
      userId,
      periodType,
      year,
    })

    if (existing) {
      return res.status(409).json({
        message: "Reporting period already exists for this year",
      })
    }

    const reportingPeriod = {
      userId,
      periodType,
      year,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(reportingPeriod)

    return res.status(201).json({
      message: "Reporting period created successfully",
      data: {
        _id: result.insertedId,
        ...reportingPeriod,
      },
    })
  } catch (error) {
    console.error("Error creating reporting period:", error)
    return res.status(500).json({
      message: "Failed to create reporting period",
    })
  }
})

/**
 * GET - Fetch all reporting periods for logged-in user
 * Protected Route
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id

    const { db } = await connectToDatabase()
    const collection = db.collection("reporting_periods")

    const periods = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return res.status(200).json({
      message: "Reporting periods fetched successfully",
      data: periods,
    })
  } catch (error) {
    console.error("Error fetching reporting periods:", error)
    return res.status(500).json({
      message: "Failed to fetch reporting periods",
    })
  }
})

/**
 * GET - Fetch single reporting period by ID
 * Protected Route
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { db } = await connectToDatabase()
    const collection = db.collection("reporting_periods")

    const period = await collection.findOne({
      _id: new ObjectId(id),
      userId,
    })

    if (!period) {
      return res.status(404).json({
        message: "Reporting period not found",
      })
    }

    return res.status(200).json({
      message: "Reporting period fetched successfully",
      data: period,
    })
  } catch (error) {
    console.error("Error fetching reporting period:", error)
    return res.status(500).json({
      message: "Failed to fetch reporting period",
    })
  }
})


router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { db } = await connectToDatabase()
    const collection = db.collection("reporting_periods")

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Reporting period not found or unauthorized",
      })
    }

    return res.status(200).json({
      message: "Reporting period deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting reporting period:", error)
    return res.status(500).json({
      message: "Failed to delete reporting period",
    })
  }
})

export default router
