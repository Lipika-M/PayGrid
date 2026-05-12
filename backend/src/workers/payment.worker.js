import { Worker } from "bullmq"

import { redis } from "../config/redis.js"

import {
  findTransactionById,
  updateTransactionStatus
} from "../models/transaction.model.js"

import {
  findWalletById
} from "../models/wallet.model.js"

import { debit, credit , transfer } from "../services/ledger.service.js"

import {
  TRANSACTION_STATUS
} from "../constants/transactionStatus.js"

import { TRANSACTION_TYPES } from "../constants/transactionTypes.js"

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
          TRANSACTION_STATUS.PROCESSING,
        client: null
      })

      const wallet =
        await findWalletById(
          transaction.wallet_id
        )

      if (!wallet) {
        throw new Error(
          "Wallet not found"
        )
      }

      if (
        transaction.transaction_type ===
        TRANSACTION_TYPES.DEBIT
      ) {
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

      } else if (
        transaction.transaction_type ===
        TRANSACTION_TYPES.CREDIT
      ) {

        await credit({
          userId: wallet.user_id,
          amount: parseInt(
            transaction.amount,
            10
          ),
          description:
            transaction.description,
          transactionId
        })

      }
     else if (transaction.transaction_type ===
          TRANSACTION_TYPES.TRANSFER) {
        await transfer({
          senderUserId: wallet.user_id,
          receiverWalletId: transaction.receiver_wallet_id,
          amount: parseInt(
            transaction.amount,
            10
          ),
          description:
            transaction.description,
          transactionId
        })
      }   
      console.log(
        `Transaction ${transactionId} SUCCESS`
      )

    } catch (err) {
      
      await updateTransactionStatus({
        transactionId,
        status:
          TRANSACTION_STATUS.FAILED,
        client: null
      })

      console.error(
        `Transaction ${transactionId} FAILED`,
        err.message
      )

      throw err
    }
  },

  {
    connection: redis,

    concurrency: 10
  }
)

worker.on("completed", (job) => {

  console.log(
    `Job ${job.id} completed`
  )
})

worker.on("failed", (job, err) => {

  console.error(
    `Job ${job?.id} failed`,
    err.message
  )
})