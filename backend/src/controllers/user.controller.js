import {
  registerUser,
  loginUser,
  getUserById
} from "../services/user.service.js"

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"

export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await registerUser(email, password)

  res.status(201).json(new ApiResponse(201, user, "User registered successfully"))
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const data = await loginUser(email, password)

  res.status(200).json(new ApiResponse(200, "Login successful", data))
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id)

  res.status(200).json(new ApiResponse(200, "User retrieved successfully", user))
})