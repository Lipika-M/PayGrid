import express from "express"

import {
  debitTransaction,
  creditTransaction,
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

export default router