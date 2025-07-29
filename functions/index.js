// Use the new V2 modules from firebase-functions
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { logger } = require("firebase-functions");
const twilio = require("twilio");
const functions = require("firebase-functions");

initializeApp();

// Initialize Twilio client by securely accessing the environment configuration
const twilioConfig = functions.config().twilio;
const accountSid = twilioConfig.account_sid;
const authToken = twilioConfig.auth_token;
const twilioPhoneNumber = twilioConfig.phone_number;

const client = new twilio(accountSid, authToken);

/**
 * A 2nd Generation callable Cloud Function that sends an SMS via Twilio.
 */
exports.sendSmsNotification = onCall((request) => {
  // In V2, the data is in `request.data`
  const phoneNumber = request.data.phoneNumber;
  const message = request.data.message;

  // --- Data Validation ---
  if (!phoneNumber || !message) {
    logger.error("Missing phone number or message in request.", {
      structuredData: true,
    });
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a `phoneNumber` and `message`."
    );
  }

  logger.info(`Attempting to send SMS to ${phoneNumber}: "${message}"`);

  // --- Send the SMS using Twilio ---
  return client.messages
    .create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    })
    .then((messageResponse) => {
      logger.info("SMS sent successfully! SID:", messageResponse.sid, {
        structuredData: true,
      });
      return { success: true, sid: messageResponse.sid };
    })
    .catch((error) => {
      logger.error("Twilio SMS sending failed:", error, {
        structuredData: true,
      });
      throw new functions.https.HttpsError(
        "internal",
        `Failed to send SMS: ${error.message}`
      );
    });
});
