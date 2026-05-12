import { pool } from "../config/db.js"

export const createWallet = async (userId,client) => {
  const db = client || pool
  const result = await db.query(
    `
    INSERT INTO wallets (user_id)
    VALUES ($1)
    RETURNING *
    `,
    [userId]
  )

  return result.rows[0]
}

export const findWalletByUserId = async (userId, client) => {
  const db = client || pool
  const result = await db.query(
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
  newBalance,
  client
}) => {
  const db = client || pool
  const result = await db.query(
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

export const findWalletById = async (
  walletId,
  client
) => {
  const db = client || pool

  const result = await db.query(
    `
    SELECT *
    FROM wallets
    WHERE id = $1
    `,
    [walletId]
  )

  return result.rows[0]
}