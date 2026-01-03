import jwt from "jsonwebtoken"
import User from "../models/User.js"
import dotenv from "dotenv"
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account disabled" })
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role || "AUDITOR",
      companyName: user.companyName || "Organization",
    }
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" })
    }
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

export const verifyToken = authMiddleware
