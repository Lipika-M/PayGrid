import pkg from "pg"
import { env } from "./env.js"

const { Pool } = pkg

const ssl = env.DB_SSL ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED } : undefined

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	ssl
})