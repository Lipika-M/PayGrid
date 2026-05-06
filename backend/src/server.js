import "dotenv/config"
import { app } from "./app.js"
import { env } from "./config/env.js"
import { pool } from "./config/db.js"
import { redis } from "./config/redis.js"

const startServer = async () => {
  try {
     await pool.query("SELECT 1")
    console.log("PostgreSQL connected")

     await redis.ping()
    console.log("Redis connected")

     app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`)
    })

  } catch (err) {
    console.error("Startup failed:", err)
    process.exit(1)  
  }
}

startServer()
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...")

  await pool.end()
  redis.disconnect()

  process.exit(0)
})