import dotenv from "dotenv"

dotenv.config()

const parseBoolean = (value, fallback = false) => {
	if (value === undefined || value === null || value === "") {
		return fallback
	}

	return ["true", "1", "yes", "on"].includes(String(value).toLowerCase())
}

const getRequiredEnv = (key) => {
	const value = process.env[key]

	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`)
	}

	return value
}

const NODE_ENV = process.env.NODE_ENV ?? "development"
const isProduction = NODE_ENV === "production"

const DATABASE_URL = getRequiredEnv("DATABASE_URL")
const isSupabase = /supabase\.(co|com)/i.test(DATABASE_URL)

export const env = Object.freeze({
	NODE_ENV,
	isProduction,
	PORT: Number(process.env.PORT) || 5000,
	DATABASE_URL,
	DB_SSL: parseBoolean(process.env.DB_SSL, isProduction || isSupabase),
	DB_SSL_REJECT_UNAUTHORIZED: parseBoolean(
		process.env.DB_SSL_REJECT_UNAUTHORIZED,
		isSupabase ? false : isProduction
	),
	JWT_SECRET: getRequiredEnv("JWT_SECRET"),
	REDIS_URL: getRequiredEnv("REDIS_URL"),
	CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000"
})