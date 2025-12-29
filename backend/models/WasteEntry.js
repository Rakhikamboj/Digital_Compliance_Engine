import mongoose from "mongoose"

const WasteEntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  reportingPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReportingPeriod",
  },
  wasteMaterial: {
    type: String,
    required: true,
  },
  wasteHandler: String,
  modeOfDisposal: String,
  inputDate: Date,
  includeHazardous: Boolean,
  includeNonHazardous: Boolean,
  hazardousData: mongoose.Schema.Types.Mixed,
  nonHazardousData: mongoose.Schema.Types.Mixed,
  hazardousDiversion: String,
  hazardousDiversionPercent: String,
  nonHazardousDiversion: String,
  nonHazardousDiversionPercent: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.WasteEntry || mongoose.model("WasteEntry", WasteEntrySchema)
