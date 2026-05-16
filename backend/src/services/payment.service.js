import { razorpay } from "../config/razorpay.js"

import {
  createPayment
} from "../models/payment.model.js"

import { PAYMENT_STATUS }
from "../constants/paymentStatus.js"

import { ApiError }
from "../utils/apiError.js"

export const createRazorpayOrder =
  async ({
    userId,
    amount  
  }) => {

    if (!amount || amount <= 0) {
      throw new ApiError(
        400,
        "Amount must be positive"
      )
    }

    const order =
      await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      })

    await createPayment({
      userId,
      razorpayOrderId: order.id,
      amount,
      currency: "INR",
      status: PAYMENT_STATUS.CREATED
    })

    return order
  }