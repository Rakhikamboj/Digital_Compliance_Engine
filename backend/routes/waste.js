import express from "express";
import { connectToDatabase } from "../lib/mongodb.js";
import { ObjectId } from "mongodb";

const router = express.Router();

/**
 * POST - Save waste entry
 */
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      reportingPeriodId,
      wasteMaterial,
      wasteHandler,
      modeOfDisposal,
      inputDate,
      includeHazardous,
      includeNonHazardous,
      hazardousData,
      nonHazardousData,
      hazardousDiversion,
      hazardousDiversionPercent,
      nonHazardousDiversion,
      nonHazardousDiversionPercent,
    } = req.body;

    if (!wasteMaterial) {
      return res.status(400).json({
        message: "Waste material is required",
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("waste_entries");

    const wasteEntry = {
      userId,
      reportingPeriodId,
      wasteMaterial,
      wasteHandler: wasteHandler || null,
      modeOfDisposal: modeOfDisposal || null,
      inputDate: inputDate || null,
      includeHazardous,
      includeNonHazardous,
      hazardousData: includeHazardous ? hazardousData : null,
      nonHazardousData: includeNonHazardous ? nonHazardousData : null,
      hazardousDiversion: includeHazardous ? hazardousDiversion : null,
      hazardousDiversionPercent: includeHazardous
        ? hazardousDiversionPercent
        : null,
      nonHazardousDiversion: includeNonHazardous
        ? nonHazardousDiversion
        : null,
      nonHazardousDiversionPercent: includeNonHazardous
        ? nonHazardousDiversionPercent
        : null,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(wasteEntry);

    return res.status(201).json({
      message: "Waste entry saved successfully",
      data: {
        _id: result.insertedId,
        ...wasteEntry,
      },
    });
  } catch (error) {
    console.error("Error saving waste entry:", error);
    return res.status(500).json({
      message: "Failed to save waste entry",
      error: error.message || "Unknown error",
    });
  }
});

/**
 * GET - Fetch waste entries
 */
router.get("/", async (req, res) => {
  try {
    const { userId, reportingPeriodId } = req.query;

    const { db } = await connectToDatabase();
    const collection = db.collection("waste_entries");

    const query = {};
    if (userId) query.userId = userId;
    if (reportingPeriodId) query.reportingPeriodId = reportingPeriodId;

    const entries = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      message: "Waste entries retrieved successfully",
      data: entries,
    });
  } catch (error) {
    console.error("Error fetching waste entries:", error);
    return res.status(500).json({
      message: "Failed to fetch waste entries",
      error: error.message || "Unknown error",
    });
  }
});

/**
 * DELETE - Delete waste entry
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Entry ID is required",
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("waste_entries");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Entry not found",
      });
    }

    return res.status(200).json({
      message: "Waste entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting waste entry:", error);
    return res.status(500).json({
      message: "Failed to delete waste entry",
      error: error.message || "Unknown error",
    });
  }
});

export default router;
