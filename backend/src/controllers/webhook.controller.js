import {
  handleRazorpayWebhook
} from "../services/webhook.service.js"

export const razorpayWebhook =
  async (req, res) => {

    try {

      await handleRazorpayWebhook({
        rawBody: req.body,
        signature:
          req.headers[
            "x-razorpay-signature"
          ]
      })

      return res.status(200).json({
        success: true
      })

    } catch (err) {

      console.error(err)

      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
  }