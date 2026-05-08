import { pool } from "../config/db.js"

export const createWallet = async (userId) => {
  const result = await pool.query(
    `
    INSERT INTO wallets (user_id)
    VALUES ($1)
    RETURNING *
    `,
    [userId]
  )

  return result.rows[0]
}

export const findWalletByUserId = async (userId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM wallets
    WHERE user_id = $1
    `,
    [userId]
  )

  return result.rows[0]
}

export const updateWalletBalance = async ({
  walletId,
  currentVersion,
  newBalance
}) => {
  const result = await pool.query(
    `
    UPDATE wallets
    SET
      balance = $1,
      version = version + 1
    WHERE id = $2
    AND version = $3
    RETURNING *
    `,
    [newBalance, walletId, currentVersion]
  )

  return result.rows[0]
}