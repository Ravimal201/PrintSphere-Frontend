import axios from "axios";
import { API_BASE_URL } from "../config/api";

const BASE_URL = API_BASE_URL || "http://localhost:5000/api";

/**
 * Creates a Stripe Checkout Session via backend API
 * @param {string} orderId - Target order ID
 * @param {string} gateway - Gateway type ("stripe" or "payhere")
 * @returns {Promise<Object>} Response containing Stripe checkout URL & session details
 */
export const createCheckoutSession = async (orderId, gateway = "stripe") => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.post(
      `${BASE_URL}/payment/create-checkout-session`,
      { orderId, gateway },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error.response?.data || error;
  }
};

/**
 * Verifies payment success status with backend after Stripe redirect
 * @param {string} sessionId - Stripe session ID
 * @param {string} orderId - Order ID
 */
export const verifyPaymentSuccess = async (sessionId, orderId) => {
  try {
    const response = await axios.get(`${BASE_URL}/payment/success`, {
      params: { session_id: sessionId, order_id: orderId }
    });
    return response.data;
  } catch (error) {
    console.error("Error verifying payment success:", error);
    throw error.response?.data || error;
  }
};

/**
 * Retrieves payment record by payment ID
 * @param {string} paymentId 
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const response = await axios.get(`${BASE_URL}/payment/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw error.response?.data || error;
  }
};

/**
 * Processes payment from any custom payment account
 * @param {string} orderId 
 * @param {Object} accountDetails 
 */
export const processAccountPayment = async (orderId, accountDetails) => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.post(
      `${BASE_URL}/payment/process-account-payment`,
      { orderId, accountDetails },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error processing payment account payment:", error);
    throw error.response?.data || error;
  }
};

/**
 * Processes manual card payment simulating gateway responses
 * @param {string} orderId 
 * @param {Object} cardDetails 
 */
export const processCardPayment = async (orderId, cardDetails) => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.post(
      `${BASE_URL}/payment/process-card-payment`,
      { orderId, cardDetails },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error processing card payment:", error);
    throw error.response?.data || error;
  }
};
