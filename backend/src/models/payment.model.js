import { pool } from "../config/db.js"

export const createPayment = async ({
  userId,
  razorpayOrderId,
  amount,
  currency,
  status,
  client
}) => {

  const db = client || pool

  const result = await db.query(
    `
    INSERT INTO payments (
      user_id,
      razorpay_order_id,
      amount,
      currency,
      status
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      userId,
      razorpayOrderId,
      amount,
      currency,
      status
    ]
  )

  return result.rows[0]
}

export const findPaymentByOrderId =
  async (razorpayOrderId, client) => {

    const db = client || pool

    const result = await db.query(
      `
      SELECT *
      FROM payments
      WHERE razorpay_order_id = $1
      `,
      [razorpayOrderId]
    )

    return result.rows[0]
  }

export const updatePaymentVerification =
  async ({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    transactionId,
    status,
    webhookPayload = null,
    client
  }) => {

    const db = client || pool

    const result = await db.query(
      `
      UPDATE payments
      SET
        razorpay_payment_id = $1,
        razorpay_signature = $2,
        transaction_id = $3,
        status = $4,
        webhook_payload = $5,
        updated_at = NOW()
      WHERE razorpay_order_id = $6
      RETURNING *
      `,
      [
        razorpayPaymentId,
        razorpaySignature,
        transactionId,
        status,
        webhookPayload,
        razorpayOrderId
      ]
    )

    return result.rows[0]
  }

export const markPaymentFailed =
  async ({
    razorpayOrderId,
    webhookPayload = null,
    client
  }) => {

    const db = client || pool

    const result = await db.query(
      `
      UPDATE payments
      SET
        status = 'FAILED',
        webhook_payload = $1,
        updated_at = NOW()
      WHERE razorpay_order_id = $2
      RETURNING *
      `,
      [
        webhookPayload,
        razorpayOrderId
      ]
    )

    return result.rows[0]
  }