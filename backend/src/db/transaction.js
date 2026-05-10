import { pool } from "../config/db.js"

export const withTransaction = async (
  callback
) => {

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    const result =
      await callback(client)

    await client.query("COMMIT")

    return result

  } catch (err) {

    await client.query("ROLLBACK")

    throw err

  } finally {

    client.release()
  }
}