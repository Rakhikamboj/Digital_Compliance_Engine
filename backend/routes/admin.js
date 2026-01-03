import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import { allowRoles } from "../middleware/role.js"
import { createAuditor, getAuditors, createProject, getProjects } from "../controllers/admin.js"
import Project from "../models/Project.js"// Assuming Project model is imported here
import { updateProjectStatus } from "../controllers/auditor.js"
const router = express.Router()

router.use(authMiddleware)
router.use(allowRoles("ADMIN"))

router.post("/auditors", createAuditor)
router.get("/auditors", getAuditors)
router.post("/projects", createProject)
router.get("/projects", getProjects)

router.get("/my-projects", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ assignedAuditor: req.user.id })
    res.status(200).json(projects)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})
router.patch("/projects/:id/status", updateProjectStatus)

export default router
