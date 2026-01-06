import mongoose from "mongoose"

const wasteDataSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 },
    reuse: { type: Number, default: 0 },
    recycle: { type: Number, default: 0 },
    composting: { type: Number, default: 0 },
    incinerationWithHeat: { type: Number, default: 0 },
    incinerationWithoutHeat: { type: Number, default: 0 },
    landfill: { type: Number, default: 0 },
    exemption: { type: Number, default: 0 },
  },
  { _id: false },
)

const wasteEntrySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportingPeriod: {
      periodType: { type: String, enum: ["financial", "calendar"], required: true },
      year: { type: String, required: true },
    },
    wasteMaterial: { type: String, required: true },
    wasteHandler: { type: String },
    modeOfDisposal: { type: String },
    inputDate: { type: Date },
    unit: { type: String, enum: ["Kilograms(kg)", "Tonnes", "Metric Tonnes(MT)"], default: "kg" },
    includeHazardous: { type: Boolean, default: false },
    includeNonHazardous: { type: Boolean, default: false },
    hazardousData: wasteDataSchema,
    nonHazardousData: wasteDataSchema,
    hazardousDiversion: { type: Number, default: 0 },
    hazardousDiversionPercent: { type: Number, default: 0 },
    nonHazardousDiversion: { type: Number, default: 0 },
    nonHazardousDiversionPercent: { type: Number, default: 0 },
    complianceScore: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model("WasteEntry", wasteEntrySchema)
