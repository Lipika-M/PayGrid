import { pool } from "../config/db.js"

export const createTransaction = async ({
  walletId,
  transactionType,
  amount,
  status,
  idempotencyKey,
  description
}) => {

  const result = await pool.query(
    `
    INSERT INTO transactions (
      wallet_id,
      transaction_type,
      amount,
      status,
      idempotency_key,
      description
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      walletId,
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
  transactionId
) => {

  const result = await pool.query(
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
  async (idempotencyKey) => {

    const result = await pool.query(
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
  status
}) => {

  const result = await pool.query(
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