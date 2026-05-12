import {
  createLedgerEntry,
  getWalletLedgerEntries,
} from "../models/ledger.model.js";

import { withTransaction } from "../db/transaction.js";

import {
  findWalletById,
  findWalletByUserId,
  updateWalletBalance,
} from "../models/wallet.model.js";

import { updateTransactionStatus } from "../models/transaction.model.js";
import { ApiError } from "../utils/apiError.js";

import { LEDGER_TYPES } from "../constants/ledgerTypes.js";
import { TRANSACTION_STATUS } from "../constants/transactionStatus.js";

const MAX_RETRIES = 3;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const performCredit = async ({
  userId,
  amount,
  description,
  transactionId,
}) => {
  return await withTransaction(async (client) => {
    const wallet = await findWalletByUserId(userId, client);

    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    const currentBalance = parseInt(wallet.balance, 10);

    const currentVersion = parseInt(wallet.version, 10);

    const newBalance = currentBalance + amount;

    const updatedWallet = await updateWalletBalance({
      walletId: wallet.id,
      currentVersion,
      newBalance,
      client,
    });

    if (!updatedWallet) {
      throw new ApiError(409, "Concurrent update detected");
    }

    const entry = await createLedgerEntry({
      walletId: wallet.id,
      transactionId,
      entryType: LEDGER_TYPES.CREDIT,
      amount,
      balanceAfter: newBalance,
      description,
      client,
    });

    await updateTransactionStatus({
      transactionId,
      status: TRANSACTION_STATUS.SUCCESS,
      client,
    });

    return entry;
  });
};

const performDebit = async ({ userId, amount, description, transactionId }) => {
  return await withTransaction(async (client) => {
    const wallet = await findWalletByUserId(userId, client);

    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    const currentBalance = parseInt(wallet.balance, 10);

    const currentVersion = parseInt(wallet.version, 10);

    if (currentBalance < amount) {
      throw new ApiError(400, "Insufficient balance");
    }

    const newBalance = currentBalance - amount;

    const updatedWallet = await updateWalletBalance({
      walletId: wallet.id,
      currentVersion,
      newBalance,
      client,
    });

    // optimistic locking conflict
    if (!updatedWallet) {
      throw new ApiError(409, "Concurrent update detected");
    }

    const entry = await createLedgerEntry({
      walletId: wallet.id,
      transactionId,
      entryType: LEDGER_TYPES.DEBIT,
      amount,
      balanceAfter: newBalance,
      description,
      client,
    });

    await updateTransactionStatus({
      transactionId,
      status: TRANSACTION_STATUS.SUCCESS,
      client,
    });

    return entry;
  });
};

export const credit = async ({
  userId,
  amount,
  description = "credit",
  transactionId,
}) => {
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be positive");
  }

  let retries = MAX_RETRIES;

  while (retries > 0) {
    try {
      return await performCredit({
        userId,
        amount,
        description,
        transactionId,
      });
    } catch (err) {
      if (err.statusCode === 409) {
        retries--;

        await delay(50);

        continue;
      }

      throw err;
    }
  }

  throw new ApiError(409, "Credit failed after retries");
};

export const debit = async ({
  userId,
  amount,
  description = "debit",
  transactionId,
}) => {
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be positive");
  }

  let retries = MAX_RETRIES;

  while (retries > 0) {
    try {
      return await performDebit({
        userId,
        amount,
        description,
        transactionId,
      });
    } catch (err) {
      if (err.statusCode === 409) {
        retries--;

        await delay(50);

        continue;
      }

      throw err;
    }
  }

  throw new ApiError(409, "Debit failed after retries");
};

export const getBalance = async (userId) => {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  return {
    balance: parseInt(wallet.balance, 10),
    version: parseInt(wallet.version, 10),
  };
};

export const getLedgerHistory = async (userId) => {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  return await getWalletLedgerEntries(wallet.id);
};

const performTransfer = async ({
  senderUserId,
  receiverWalletId,
  amount,
  description,
  transactionId,
}) => {
  return await withTransaction(async (client) => {
    const senderWallet = await findWalletByUserId(senderUserId, client);

    const receiverWallet = await findWalletById(receiverWalletId, client);

    if (!senderWallet) {
      throw new ApiError(404, "Sender wallet not found");
    }

    if (!receiverWallet) {
      throw new ApiError(404, "Receiver wallet not found");
    }
    if (senderWallet.id === receiverWallet.id) {
      throw new ApiError(400, "Cannot transfer to the same wallet");
    }
    const senderBalance = parseInt(senderWallet.balance, 10);
    const senderVersion = parseInt(senderWallet.version, 10);
    if (senderBalance < amount) {
      throw new ApiError(400, "Insufficient balance");
    }
    const receiverBalance = parseInt(receiverWallet.balance, 10);
    const receiverVersion = parseInt(receiverWallet.version, 10);
    const senderNewBalance = senderBalance - amount;
    const receiverNewBalance = receiverBalance + amount;

    const updatedSender = await updateWalletBalance({
      walletId: senderWallet.id,
      currentVersion: senderVersion,
      newBalance: senderNewBalance,
      client,
    });

    if (!updatedSender) {
      throw new ApiError(409, "Concurrent update detected for sender");
    }
    const updatedReceiver = await updateWalletBalance({
      walletId: receiverWallet.id,
      currentVersion: receiverVersion,
      newBalance: receiverNewBalance,
      client,
    });
    if (!updatedReceiver) {
      throw new ApiError(409, "Concurrent update detected for receiver");
    }
    await createLedgerEntry({
      walletId: senderWallet.id,
      transactionId,
      entryType: LEDGER_TYPES.DEBIT,
      amount,
      balanceAfter: senderNewBalance,
      description: `${description} (to wallet ${receiverWallet.id})`,
      client,
    });
    await createLedgerEntry({
      walletId: receiverWallet.id,
      transactionId,
      entryType: LEDGER_TYPES.CREDIT, 
      amount,
      balanceAfter: receiverNewBalance,
      description: `${description} (from wallet ${senderWallet.id})`,
      client,
    });
    await updateTransactionStatus({
      transactionId,
      status: TRANSACTION_STATUS.SUCCESS,
      client,
    });
    return true;
  });
};

export const transfer = async ({
  senderUserId,
  receiverWalletId,
  amount,
  description,
  transactionId,
}) => {
  let retries = MAX_RETRIES;
  while (retries > 0) {
    try {
      return await performTransfer({
        senderUserId,
        receiverWalletId,
        amount,
        description,
        transactionId,
      });
    } catch (err) {
      if (err.statusCode === 409) {
        retries--;
        await delay(50);
        continue;
      }
      throw err;
    }
  }
  throw new ApiError(409, "Transfer failed after retries"); 
};
