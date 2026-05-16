import crypto from "crypto"

import { env }
from "../config/env.js"

import { withTransaction }
from "../db/transaction.js"

import {
  findPaymentByOrderId,
  updatePaymentVerification,
  markPaymentFailed
} from "../models/payment.model.js"

import {
  createCreditTransaction
} from "./transaction.service.js"

import { PAYMENT_STATUS }
from "../constants/paymentStatus.js"

export const handleRazorpayWebhook =
  async ({
    rawBody,
    signature
  }) => {

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(rawBody)
        .digest("hex")

    if (expectedSignature !== signature) {
      throw new Error(
        "Invalid webhook signature"
      )
    }

    const payload =
      JSON.parse(rawBody.toString())

    const event = payload.event

    if (event === "payment.captured") {

      const paymentEntity =
        payload.payload.payment.entity

      const razorpayOrderId =
        paymentEntity.order_id

      const razorpayPaymentId =
        paymentEntity.id

      await withTransaction(
        async (client) => {

          const payment =
            await findPaymentByOrderId(
              razorpayOrderId,
              client
            )

          if (!payment) {
            throw new Error(
              "Payment not found"
            )
          }

          if (payment.transaction_id) {
            return
          }

          const transaction =
            await createCreditTransaction({
              userId: payment.user_id,
              amount: parseInt(
                payment.amount,
                10
              ),
              description:
                "Wallet top-up",
              idempotencyKey:
                razorpayPaymentId
            })

          await updatePaymentVerification({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature:
              signature,
            transactionId:
              transaction.id,
            status:
              PAYMENT_STATUS.VERIFIED,
            webhookPayload:
              payload,
            client
          })
        }
      )
    }

     if (event === "payment.failed") {

      const paymentEntity =
        payload.payload.payment.entity

      await markPaymentFailed({
        razorpayOrderId:
          paymentEntity.order_id,
        webhookPayload: payload
      })
    }
  }