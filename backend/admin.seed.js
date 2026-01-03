import mongoose from "mongoose"
import User from "./models/User.js"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"

dotenv.config()

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    const existingAdmin = await User.findOne({ email: "admin@org.com" })
    if (existingAdmin) {
      console.log("Deleting existing admin user...")
      await User.deleteOne({ email: "admin@org.com" })
    }

    const plainPassword = process.env.ADMIN_PASSWORD
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    


    // console.log("  Hashed Password (first 20 chars):", hashedPassword.substring(0, 20) + "...")

    const adminUser = await User.create({
      email: "admin@org.com",
      password: hashedPassword,
      companyName: "Digital Compliance Corp",
      role: "ADMIN",
      isActive: true,
    })

    const testCompare = await bcrypt.compare(plainPassword, adminUser.password)
    console.log("Password verification test:", testCompare ? "PASSED ✓" : "FAILED ✗")

    if (testCompare) {
      console.log("Admin seeded successfully!")
      // console.log("Login with: admin@org.com / AdminPassword123")
    } else {
      console.error("Password verification failed! Something is wrong.")
    }

    process.exit()
  } catch (err) {
    console.error("Seed error:", err)
    process.exit(1)
  }
}

seedAdmin()
