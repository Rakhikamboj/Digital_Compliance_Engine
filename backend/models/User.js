import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    auditorName: {
      type: String,
      required: function () {
        return this.role === "AUDITOR"
      },
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "AUDITOR"],
      default: "AUDITOR",
    },
    isActive: { type: Boolean, default: true },
    phoneNumber: { type: String },
  },
  { timestamps: true },
)

export default mongoose.models.User || mongoose.model("User", userSchema)
