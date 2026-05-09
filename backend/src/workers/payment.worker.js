import { Worker }
from "bullmq"

import { redis }
from "../config/redis.js"

import {
  findTransactionById,
  updateTransactionStatus
} from "../models/transaction.model.js"

import {
  findWalletById
} from "../models/wallet.model.js"

import { debit }
from "../services/ledger.service.js"

import {
  TRANSACTION_STATUS
} from "../constants/transactionStatus.js"

export const worker = new Worker(

  "payment-processing",

  async (job) => {

    const { transactionId } = job.data

    const transaction =
      await findTransactionById(
        transactionId
      )

    if (!transaction) {
      throw new Error(
        "Transaction not found"
      )
    }

    // worker idempotency protection
    if (
      transaction.status ===
      TRANSACTION_STATUS.SUCCESS
    ) {
      return
    }

    if (
      transaction.status !==
      TRANSACTION_STATUS.PENDING
    ) {
      return
    }

    try {

      await updateTransactionStatus({
        transactionId,
        status:
          TRANSACTION_STATUS.PROCESSING
      })

      const wallet =
        await findWalletById(
          transaction.wallet_id
        )

      await debit({
        userId: wallet.user_id,
        amount: parseInt(
          transaction.amount,
          10
        ),
        description:
          transaction.description,
        transactionId
      })

      await updateTransactionStatus({
        transactionId,
        status:
          TRANSACTION_STATUS.SUCCESS
      })

      console.log(
        `Transaction ${transactionId} SUCCESS`
      )

    } catch (err) {

      await updateTransactionStatus({
        transactionId,
        status:
          TRANSACTION_STATUS.FAILED
      })

      console.error(
        `Transaction ${transactionId} FAILED`,
        err.message
      )

      throw err
    }
  },

  {
    connection: redis
  }
)