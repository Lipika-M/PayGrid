import express from "express"

import {
  getWalletBalance,
  getLedgerEntries
} from "../controllers/ledger.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.route("/balance").get(verifyJWT, getWalletBalance)

router.route("/history").get(verifyJWT, getLedgerEntries)

export default router