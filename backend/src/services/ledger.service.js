import {
  createLedgerEntry,
  getWalletLedgerEntries
} from "../models/ledger.model.js"

import {
  findWalletByUserId,
  updateWalletBalance
} from "../models/wallet.model.js"

import { ApiError } from "../utils/apiError.js"

import { LEDGER_TYPES } from "../constants/ledgerTypes.js"

export const credit = async ({
  userId,
  amount,
  description = "credit",
  transactionId = null
}) => {
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be positive")
  }

  const wallet = await findWalletByUserId(userId)

  if (!wallet) {
    throw new ApiError(404, "Wallet not found")
  }

  const newBalance = Number(wallet.balance) + amount

  const updatedWallet = await updateWalletBalance({
    walletId: wallet.id,
    currentVersion: wallet.version,
    newBalance
  })

  if (!updatedWallet) {
    throw new ApiError(409, "Concurrent update detected")
  }

  return await createLedgerEntry({
    walletId: wallet.id,
    transactionId,
    entryType: LEDGER_TYPES.CREDIT,
    amount,
    balanceAfter: newBalance,
    description
  })
}

export const debit = async ({
  userId,
  amount,
  description = "debit",
  transactionId = null
}) => {
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be positive")
  }

  const wallet = await findWalletByUserId(userId)

  if (!wallet) {
    throw new ApiError(404, "Wallet not found")
  }

  if (Number(wallet.balance) < amount) {
    throw new ApiError(400, "Insufficient balance")
  }

  const newBalance = Number(wallet.balance) - amount

  const updatedWallet = await updateWalletBalance({
    walletId: wallet.id,
    currentVersion: wallet.version,
    newBalance
  })

  if (!updatedWallet) {
    throw new ApiError(409, "Concurrent update detected")
  }

  return await createLedgerEntry({
    walletId: wallet.id,
    transactionId,
    entryType: LEDGER_TYPES.DEBIT,
    amount,
    balanceAfter: newBalance,
    description
  })
}

export const getBalance = async (userId) => {
  const wallet = await findWalletByUserId(userId)

  if (!wallet) {
    throw new ApiError(404, "Wallet not found")
  }

  return {
    balance: wallet.balance,
    currency: wallet.currency,
    version: wallet.version
  }
}

export const getLedgerHistory = async (userId) => {
  const wallet = await findWalletByUserId(userId)

  if (!wallet) {
    throw new ApiError(404, "Wallet not found")
  }

  return await getWalletLedgerEntries(wallet.id)
}