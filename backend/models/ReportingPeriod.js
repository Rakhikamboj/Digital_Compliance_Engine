import mongoose from "mongoose"

const ReportingPeriodSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  periodType: {
    type: String,
    enum: ["financial", "calendar"],
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.ReportingPeriod || mongoose.model("ReportingPeriod", ReportingPeriodSchema)
