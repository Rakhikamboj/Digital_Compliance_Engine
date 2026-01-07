import Project from "../models/Project.js"

export const getMyProjects = async (req, res) => {
  try {
    const auditorId = req.user.id

    const projects = await Project.find({
      assignedAuditor: auditorId,
      status: { $ne: "Not Assigned" },
    }).populate("assignedAuditor", "email auditorName")

    res.status(200).json(projects)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, formData } = req.body
    const auditorId = req.user.id

    const project = await Project.findOne({
      _id: id,
      assignedAuditor: auditorId,
    })

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" })
    }

    if (status) project.status = status
    if (formData) project.formData = { ...project.formData, ...formData }

    await project.save()

    res.status(200).json({ message: "Project updated successfully", project })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}


