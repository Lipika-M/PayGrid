import express from "express"

import {
  creditWallet,
  debitWallet,
  getWalletBalance,
  getLedgerEntries
} from "../controllers/ledger.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.route("/credit").post(verifyJWT, creditWallet)

router.route("/debit").post(verifyJWT, debitWallet)

router.route("/balance").get(verifyJWT, getWalletBalance)

router.route("/history").get(verifyJWT, getLedgerEntries)

export default router