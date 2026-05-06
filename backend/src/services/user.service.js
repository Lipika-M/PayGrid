import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { ApiError } from "../utils/apiError.js"

import {
  createUser,
  findUserByEmail,
  findUserById
} from "../models/user.model.js"

export const registerUser = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required")
  }

  const normalizedEmail = email.toLowerCase().trim()

  const existingUser = await findUserByEmail(normalizedEmail)

  if (existingUser) {
    throw new ApiError(400, "User already exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  return await createUser(normalizedEmail, hashedPassword)
}

export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required")
  }

  const normalizedEmail = email.toLowerCase().trim()

  const user = await findUserByEmail(normalizedEmail)

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
  const user = await findUserById(id)

  if (!user) throw new ApiError(404, "User not found")

  return user
}