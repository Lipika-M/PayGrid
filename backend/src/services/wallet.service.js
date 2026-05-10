import {
  createWallet,
  findWalletByUserId
} from "../models/wallet.model.js"

import { ApiError } from "../utils/apiError.js"

export const createUserWallet = async (userId) => {
   const existingWallet = await findWalletByUserId(userId)

  if (existingWallet) {
    throw new ApiError(400, "Wallet already exists")
  }

  return await createWallet(userId)
}

export const getMyWallet = async (userId) => {
  const wallet = await findWalletByUserId(userId)

  if (!wallet) {
    throw new ApiError(404, "Wallet not found")
  }

  return {
    ...wallet,
    balance: parseInt(wallet.balance, 10),
    version: parseInt(wallet.version, 10)
  }
}