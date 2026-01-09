import mongoose from "mongoose"

const ProjectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    projectDescription: { type: String },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientNumber: { type: String, required: true },
    companyName: { type: String, required: true },
    industry: { type: String, required: true },
    reportingPeriod: { type: Object, required: true },
    assignedAuditor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Not Assigned", "Assigned", "In Progress", "Completed"],
      default: "Not Assigned",
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema)
