import { createDebitTransaction ,getTransactionById } from "../services/transaction.service.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiResponse } from "../utils/apiResponse.js";

export const debitTransaction = asyncHandler(async (req, res) => {
  const { amount, description, idempotencyKey } = req.body;

  const transaction = await createDebitTransaction({
    userId: req.user.id,
    amount: parseInt(amount, 10),
    description,
    idempotencyKey,
  });

  res.status(202).json(new ApiResponse(202, "Transaction queued", transaction));
});

export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await getTransactionById(req.params.id);

  res.json(new ApiResponse(200,"Transaction found", transaction));
});
