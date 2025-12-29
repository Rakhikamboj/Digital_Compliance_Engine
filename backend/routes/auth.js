import express from "express"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { email, password, companyName } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = new User({ 
      email, 
      password: hashedPassword, 
      companyName: companyName || "Organization" 
    })
    await user.save()

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    
    res.status(201).json({ 
      token, 
      user: { 
        email: user.email, 
        companyName: user.companyName 
      } 
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    
    res.status(200).json({ 
      token, 
      user: { 
        email: user.email, 
        companyName: user.companyName 
      } 
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      email: req.user.email,
      companyName: req.user.companyName || "Organization",
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router