import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { pool } from "../config/db.js"
import { env } from "../config/env.js"
import { ApiError } from "../utils/apiError.js"

export const registerUser = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required")
  }

  const normalizedEmail = email.toLowerCase().trim()

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [normalizedEmail, hashedPassword]
    )

    return result.rows[0]
  } catch (err) {
    if (err.code === "23505") {
      throw new ApiError(400, "User already exists")
    }
    throw err
  }
}

export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required")
  }

  const normalizedEmail = email.toLowerCase().trim()

  const result = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [normalizedEmail]
  )

  const user = result.rows[0]

  if (!user) throw new ApiError(401, "Invalid credentials")

  const isMatch = await bcrypt.compare(password, user.password_hash)

  if (!isMatch) throw new ApiError(401, "Invalid credentials")

  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set")
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, type: "access" },
    env.JWT_SECRET,
    { expiresIn: "1d" }
  )

  return {
    user: { id: user.id, email: user.email },
    token
  }
}

export const getUserById = async (id) => {
  const result = await pool.query(
    "SELECT id, email, created_at FROM users WHERE id = $1",
    [id]
  )

  const user = result.rows[0]

  if (!user) throw new ApiError(404, "User not found")

  return user
}