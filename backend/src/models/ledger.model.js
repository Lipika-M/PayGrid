import { pool } from "../config/db.js"

export const createLedgerEntry = async ({
  walletId,
  transactionId = null,
  entryType,
  amount,
  balanceAfter,
  description
}) => {
  const result = await pool.query(
    `
    INSERT INTO ledger_entries (
      wallet_id,
      transaction_id,
      entry_type,
      amount,
      balance_after,
      description
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      walletId,
      transactionId,
      entryType,
      amount,
      balanceAfter,
      description
    ]
  )

  return result.rows[0]
}

export const getWalletLedgerEntries = async (walletId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM ledger_entries
    WHERE wallet_id = $1
    ORDER BY created_at DESC
    `,
    [walletId]
  )

  return result.rows
}