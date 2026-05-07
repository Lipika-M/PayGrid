import {
  createUserWallet,
  getMyWallet
} from "../services/wallet.service.js"

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js"

export const createWallet = asyncHandler(async (req, res) => {
  const wallet = await createUserWallet(req.user.id)

  res.status(201).json(
    new ApiResponse(201, "Wallet created", wallet)
  )
})

export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await getMyWallet(req.user.id)

  res.json(
    new ApiResponse(200, "Wallet retrieved", wallet)
  )
})