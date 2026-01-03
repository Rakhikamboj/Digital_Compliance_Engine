import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "AUDITOR"],
      default: "AUDITOR",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phoneNumber: { type: String },
    auditorName: { type: String },
  },
  { timestamps: true },
)

// Hash password before saving
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next()
//   this.password = await bcrypt.hash(this.password, 10)
//   next()
// })

export default mongoose.models.User || mongoose.model("User", userSchema)
