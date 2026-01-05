import bcrypt from "bcryptjs"
import User from "../models/User.js"
import Project from "../models/Project.js"

export const createAuditor = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can create auditors" })
    }

    const { email, password, companyName, auditorName, phoneNumber, isActive } = req.body

    if (!auditorName) {
      return res.status(400).json({ message: "Auditor name is required" })
    }

    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: "User already exists" })

    const hashedPassword = await bcrypt.hash(password || "Auditor@123", 10)

    const auditor = await User.create({
      auditorName,
      email,
      password: hashedPassword,
      companyName,
      role: "AUDITOR",
      phoneNumber,
      isActive: isActive ?? true,
    })

    res.status(201).json({
      message: "Auditor created successfully",
      auditor: {
        id: auditor._id,
        auditorName: auditor.auditorName,
        email: auditor.email,
        role: auditor.role,
        isActive: auditor.isActive,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}


// Get all auditors (for project assignment)
export const getAuditors = async (req, res) => {
  try {
    const auditors = await User.find({ role: "AUDITOR" }).select("-password")
    res.status(200).json(auditors)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}

// Create Project
export const createProject = async (req, res) => {
  try {
    const projectData = req.body

    if (projectData.assignedAuditor) {
      projectData.status = "Assigned"
    }

    const project = await Project.create(projectData)
    res.status(201).json({ message: "Project created successfully", project })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all projects (optional: Admin dashboard)
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("assignedAuditor", "email companyName phoneNumber")
    res.status(200).json(projects)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}
