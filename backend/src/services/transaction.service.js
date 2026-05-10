import {
  createTransaction,
  findTransactionById,
  findTransactionByIdempotencyKey,
} from "../models/transaction.model.js";

import { findWalletByUserId } from "../models/wallet.model.js";

import { paymentQueue } from "../queue/payment.queue.js";

import { ApiError } from "../utils/apiError.js";

import { TRANSACTION_STATUS } from "../constants/transactionStatus.js";

import { TRANSACTION_TYPES } from "../constants/transactionTypes.js";

export const getTransactionById = async (transactionId) => {
  return await findTransactionById(transactionId);
};

export const createDebitTransaction = async ({
  userId,
  amount,
  description,
  idempotencyKey,
}) => {
  if (!idempotencyKey) {
    throw new ApiError(400, "Idempotency key required");
  }

  if (amount <= 0) {
    throw new ApiError(400, "Amount must be positive");
  }

  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  let transaction;

  try {
    transaction = await createTransaction({
      walletId: wallet.id,
      transactionType: TRANSACTION_TYPES.DEBIT,
      amount,
      status: TRANSACTION_STATUS.PENDING,
      idempotencyKey,
      description,
    });
  } catch (err) {
    // DB-level idempotency
    if (err.code === "23505") {
      return await findTransactionByIdempotencyKey(idempotencyKey);
    }

    throw err;
  }

  await paymentQueue.add(
    "debit-wallet",
    {
      transactionId: transaction.id,
    },
    {
      jobId: transaction.id,
    }
  );

  return transaction;
};

export const createCreditTransaction =
  async ({
    userId,
    amount,
    description,
    idempotencyKey
  }) => {

    if (!idempotencyKey) {
      throw new ApiError(
        400,
        "Idempotency key required"
      )
    }

    if (amount <= 0) {
      throw new ApiError(
        400,
        "Amount must be positive"
      )
    }

    const wallet =
      await findWalletByUserId(userId)

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      )
    }

    let transaction

    try {

      transaction =
        await createTransaction({
          walletId: wallet.id,
          transactionType:
            TRANSACTION_TYPES.CREDIT,
          amount,
          status:
            TRANSACTION_STATUS.PENDING,
          idempotencyKey,
          description
        })

    } catch (err) {

      if (err.code === "23505") {

        return await findTransactionByIdempotencyKey(
          idempotencyKey
        )
      }

      throw err
    }

    await paymentQueue.add(
      "credit-wallet",
      {
        transactionId: transaction.id
      },
      {
        jobId: transaction.id
      }
    )

    return transaction
  }
