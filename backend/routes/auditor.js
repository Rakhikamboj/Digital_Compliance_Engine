import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import { allowRoles } from "../middleware/role.js"
import { getMyProjects, updateProjectStatus } from "../controllers/auditor.js"

const router = express.Router()

router.use(authMiddleware)
router.use(allowRoles("AUDITOR"))

router.get("/my-projects", getMyProjects)
router.patch("/projects/:id/status", updateProjectStatus)

export default router
