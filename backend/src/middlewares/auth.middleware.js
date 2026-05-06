import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { env } from "../config/env.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized")
  }

  const token = authHeader.split(" ")[1]

  const decoded = jwt.verify(token, env.JWT_SECRET)

   req.user = {
    id: decoded.id,
    email: decoded.email
  }

  next()
})