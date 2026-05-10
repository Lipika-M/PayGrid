import {
  createLedgerEntry,
  getWalletLedgerEntries,
} from "../models/ledger.model.js";

import { withTransaction } from "../db/transaction.js";

import {
  findWalletByUserId,
  updateWalletBalance,
} from "../models/wallet.model.js";

import { updateTransactionStatus } from "../models/transaction.model.js";
import { ApiError } from "../utils/apiError.js";

import { LEDGER_TYPES } from "../constants/ledgerTypes.js";
import { TRANSACTION_STATUS } from "../constants/transactionStatus.js";

const MAX_RETRIES = 3;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const performCredit = async ({
  userId,
  amount,
  description,
  transactionId
}) => {

  return await withTransaction(async (client) => {

    const wallet = await findWalletByUserId(
      userId,
      client
    )

    if (!wallet) {
      throw new ApiError(404, "Wallet not found")
    }

    const currentBalance =
      parseInt(wallet.balance, 10)

    const currentVersion =
      parseInt(wallet.version, 10)

    const newBalance =
      currentBalance + amount

    const updatedWallet =
      await updateWalletBalance({
        walletId: wallet.id,
        currentVersion,
        newBalance,
        client
      })

    if (!updatedWallet) {
      throw new ApiError(
        409,
        "Concurrent update detected"
      )
    }

    const entry = await createLedgerEntry({
      walletId: wallet.id,
      transactionId,
      entryType: LEDGER_TYPES.CREDIT,
      amount,
      balanceAfter: newBalance,
      description,
      client
    })

    await updateTransactionStatus({
      transactionId,
      status: TRANSACTION_STATUS.SUCCESS,
      client
    })

    return entry
  })
}


const performDebit = async ({
  userId,
  amount,
  description,
  transactionId
}) => {

  return await withTransaction(async (client) => {

    const wallet = await findWalletByUserId(
      userId,
      client
    )

    if (!wallet) {
      throw new ApiError(404, "Wallet not found")
    }

    const currentBalance =
      parseInt(wallet.balance, 10)

    const currentVersion =
      parseInt(wallet.version, 10)

    if (currentBalance < amount) {
      throw new ApiError(
        400,
        "Insufficient balance"
      )
    }

    const newBalance =
      currentBalance - amount

    const updatedWallet =
      await updateWalletBalance({
        walletId: wallet.id,
        currentVersion,
        newBalance,
        client
      })

    // optimistic locking conflict
    if (!updatedWallet) {
      throw new ApiError(
        409,
        "Concurrent update detected"
      )
    }

    const entry = await createLedgerEntry({
      walletId: wallet.id,
      transactionId,
      entryType: LEDGER_TYPES.DEBIT,
      amount,
      balanceAfter: newBalance,
      description,
      client
    })

    await updateTransactionStatus({
      transactionId,
      status: TRANSACTION_STATUS.SUCCESS,
      client
    })

    return entry
  })
}

export const credit = async ({
  userId,
  amount,
  description = "credit",
  transactionId
}) => {

  if (amount <= 0) {
    throw new ApiError(
      400,
      "Amount must be positive"
    )
  }

  let retries = MAX_RETRIES

  while (retries > 0) {

    try {

      return await performCredit({
        userId,
        amount,
        description,
        transactionId
      })

    } catch (err) {

      if (err.statusCode === 409) {

        retries--

        await delay(50)

        continue
      }

      throw err
    }
  }

  throw new ApiError(
    409,
    "Credit failed after retries"
  )
}

export const debit = async ({
  userId,
  amount,
  description = "debit",
  transactionId
}) => {

  if (amount <= 0) {
    throw new ApiError(
      400,
      "Amount must be positive"
    )
  }

  let retries = MAX_RETRIES

  while (retries > 0) {

    try {

      return await performDebit({
        userId,
        amount,
        description,
        transactionId
      })

    } catch (err) {

      if (err.statusCode === 409) {

        retries--

        await delay(50)

        continue
      }

      throw err
    }
  }

  throw new ApiError(
    409,
    "Debit failed after retries"
  )
}

export const getBalance = async (userId) => {

  const wallet = await findWalletByUserId(userId)

  if (!wallet) {
    throw new ApiError(404, "Wallet not found")
  }

  return {
    balance: parseInt(wallet.balance, 10),
    version: parseInt(wallet.version, 10)
  }
}

export const getLedgerHistory = async (userId) => {

  const wallet = await findWalletByUserId(userId)

  if (!wallet) {
    throw new ApiError(404, "Wallet not found")
  }

  return await getWalletLedgerEntries(wallet.id)
}