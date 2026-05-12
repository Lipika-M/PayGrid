import { pool } from "../config/db.js"

export const createTransaction = async ({
  walletId,
  receiverWalletId=null,
  transactionType,
  amount,
  status,
  idempotencyKey,
  description,
  client
}) => {
  const db = client || pool
  const result = await db.query(
    `
    INSERT INTO transactions (
      wallet_id,
      receiver_wallet_id,
      transaction_type,
      amount,
      status,
      idempotency_key,
      description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      walletId,
      receiverWalletId,
      transactionType,
      amount,
      status,
      idempotencyKey,
      description
    ]
  )

  return result.rows[0]
}

export const findTransactionById = async (
  transactionId,
  client
) => {
  const db = client || pool

  const result = await db.query(
    `
    SELECT *
    FROM transactions
    WHERE id = $1
    `,
    [transactionId]
  )

  return result.rows[0]
}

export const findTransactionByIdempotencyKey =
  async (idempotencyKey, client) => {
    const db = client || pool

    const result = await db.query(
      `
      SELECT *
      FROM transactions
      WHERE idempotency_key = $1
      `,
      [idempotencyKey]
    )

    return result.rows[0]
  }

export const updateTransactionStatus = async ({
  transactionId,
  status,
  client
}) => {
  const db = client || pool

  const result = await db.query(
    `
    UPDATE transactions
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, transactionId]
  )

  return result.rows[0]
}