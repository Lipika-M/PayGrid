import { createRazorpayOrder } from "../services/payment.service.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { paiseToRupees, rupeesToPaise } from "../utils/money.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const amountInPaise = rupeesToPaise(amount);

  const order = await createRazorpayOrder({
    userId: req.user.id,
    amount: amountInPaise,
  });
  const responseOrder = {
    id: order.id,
    amount: paiseToRupees(order.amount),
    currency: order.currency,
    receipt: order.receipt,
    status: order.status,
  };
  res.status(201).json(new ApiResponse(201, responseOrder, "Order created"));
});
