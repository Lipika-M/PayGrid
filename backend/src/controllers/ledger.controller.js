import {
  credit,
  debit,
  getBalance,
  getLedgerHistory
} from "../services/ledger.service.js"

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js"

export const creditWallet = asyncHandler(async (req, res) => {
  const { amount, description, transactionId } = req.body

  const entry = await credit({
    userId: req.user.id,
    amount: Number(amount),
    description,
    transactionId
  })

  res.status(200).json(
    new ApiResponse(200, "Wallet credited", entry)
  )
})

export const debitWallet = asyncHandler(async (req, res) => {
  const { amount, description, transactionId } = req.body

  const entry = await debit({
    userId: req.user.id,
    amount: Number(amount),
    description,
    transactionId
  })

  res.status(200).json(
    new ApiResponse(200, "Wallet debited", entry)
  )
})

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