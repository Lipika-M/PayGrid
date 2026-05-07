import express from "express"

import {
  createWallet,
  getWallet
} from "../controllers/wallet.controller.js"

import { verifyJWT }  from "../middlewares/auth.middleware.js"

const router = express.Router()

router.route("/").post(verifyJWT, createWallet)

router.route("/me").get(verifyJWT, getWallet)

export default router