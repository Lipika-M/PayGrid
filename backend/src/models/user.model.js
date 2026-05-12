import { pool } from "../config/db.js"

export const createUser = async (email, passwordHash,client) => {
  const db = client || pool
  const result = await db.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email`,
    [email, passwordHash]
  )

  return result.rows[0]
}

export const findUserByEmail = async (email, client) => {
  const db = client || pool
  const result = await db.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email]
  )

  return result.rows[0]
}

export const findUserById = async (id, client) => {
  const db = client || pool
  const result = await db.query(
    "SELECT id, email, created_at FROM users WHERE id = $1",
    [id]
  )

  return result.rows[0]
}