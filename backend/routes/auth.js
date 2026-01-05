import express from "express"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { authMiddleware } from "../middleware/auth.js"
import dotenv from "dotenv"

dotenv.config()
const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "development-secret-key-12345"

if (!process.env.JWT_SECRET) {
  console.warn(
    "Warning: JWT_SECRET environment variable is not defined in routes/auth.js. Using development fallback.",
  )
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // 2️⃣ Find user by email ONLY
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // 3️⃣ Allow only active users
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account disabled" })
    }

    // 4️⃣ Password check
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // 5️⃣ Generate token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    )

    // 6️⃣ Response
    res.status(200).json({
      token,
      user: {
        id: user._id,
        auditorName: user.auditorName || null,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})


router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      companyName: req.user.companyName,
      role: req.user.role,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
