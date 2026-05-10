import {
  getBalance,
  getLedgerHistory
} from "../services/ledger.service.js"

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js"

export const getWalletBalance = asyncHandler(async (req, res) => {
  const balance = await getBalance(req.user.id)

  res.status(200).json(
    new ApiResponse(200, "Wallet balance retrieved", balance)
  )
})

export const getLedgerEntries = asyncHandler(async (req, res) => {
  const entries = await getLedgerHistory(req.user.id)

  res.status(200).json(
    new ApiResponse(200, "Ledger entries retrieved", entries)
  )
})