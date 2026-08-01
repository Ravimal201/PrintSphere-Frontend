const crypto = require("crypto");
const path = require("path");

// Load environment variables from backend config path
require("dotenv").config({ path: path.join(__dirname, ".env") });
if (!process.env.PAYHERE_MERCHANT_ID) {
  require("dotenv").config({ path: path.join(__dirname, "..", "config", ".env") });
}

const merchantId = process.env.PAYHERE_MERCHANT_ID || "121XXXX";
const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const isSandbox = (process.env.PAYHERE_SANDBOX || "true") === "true";
const defaultCurrency = (process.env.PAYHERE_CURRENCY || "LKR").toUpperCase();

/**
 * Generate MD5 hash helper
 */
const md5 = (str) => crypto.createHash("md5").update(str).digest("hex");

/**
 * Generate checkout hash for frontend integration
 * @param {string} orderId 
 * @param {number|string} amount 
 * @param {string} currency 
 * @returns {string} Uppercase MD5 hash signature
 */
const generateCheckoutHash = (orderId, amount, currency) => {
  const formattedAmount = Number(amount).toFixed(2);
  const hashedSecret = md5(merchantSecret).toUpperCase();
  const rawString = merchantId + orderId + formattedAmount + currency + hashedSecret;
  return md5(rawString).toUpperCase();
};

/**
 * Verify PayHere webhook callback signature
 * @param {Object} body - Request body containing PayHere notification parameters
 * @returns {boolean} True if signature is valid
 */
const verifyCallbackSignature = (body) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig
  } = body;

  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
    return false;
  }

  const hashedSecret = md5(merchantSecret).toUpperCase();
  const rawString =
    merchant_id +
    order_id +
    payhere_amount +
    payhere_currency +
    status_code +
    hashedSecret;

  const localMd5sig = md5(rawString).toUpperCase();
  return localMd5sig === md5sig;
};

module.exports = {
  merchantId,
  merchantSecret,
  isSandbox,
  defaultCurrency,
  generateCheckoutHash,
  verifyCallbackSignature
};
