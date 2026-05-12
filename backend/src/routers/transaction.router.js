import express from "express"

import {
  debitTransaction,
  creditTransaction,
  transferTransaction,
  getTransaction
} from "../controllers/transaction.controller.js"

import {
  verifyJWT
} from "../middlewares/auth.middleware.js"

const router = express.Router()

router.route("/debit").post(
  verifyJWT,
  debitTransaction
)
router.route("/credit").post(
  verifyJWT,
  creditTransaction
)
router.route("/:id").get(
  verifyJWT,
  getTransaction
)
router.route("/transfer").post(
  verifyJWT,
  transferTransaction
)

export default router