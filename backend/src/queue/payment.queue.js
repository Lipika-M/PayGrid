import { Queue, QueueEvents } from "bullmq"

import { redis } from "../config/redis.js"

export const paymentQueue = new Queue(
  "payment-processing",
  {
    connection: redis,

    defaultJobOptions: {

      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 2000
      },

      removeOnComplete: 100,
      removeOnFail: 100
    }
  }
)

export const paymentQueueEvents =
  new QueueEvents(
    "payment-processing",
    {
      connection: redis
    }
  )

paymentQueueEvents.on(
  "completed",
  ({ jobId }) => {
    console.log(`Job ${jobId} completed`)
  }
)

paymentQueueEvents.on(
  "failed",
  ({ jobId, failedReason }) => {

    console.error(
      `Job ${jobId} failed`,
      failedReason
    )
  }
)