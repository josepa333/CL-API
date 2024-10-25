const { Requester, Validator } = require("@chainlink/external-adapter");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const customParams = {
  transactionId: ["transactionId"],
};

// Create a request to fetch transaction details based on the transactionId
const createRequest = async (input, callback) => {
  // Validate input parameters using Chainlink's Validator
  const validator = new Validator(callback, input, customParams);
  const jobRunID = validator.validated.id;
  const transactionId = validator.validated.data.transactionId;

  try {
    // Validate that the transactionId is not empty or null
    if (!transactionId) {
      throw new Error("Transaction ID is required");
    }

    // Query the database to find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId },
    });

    // Check if transaction exists
    if (!transaction) {
      const errorMsg = "Transaction not found";
      return callback(404, Requester.errored(jobRunID, { error: errorMsg }));
    }

    // Format response data
    const responseData = {
      jobRunID,
      data: { message: "Transaction found", transactionId },
    };

    // Send successful response
    callback(200, Requester.success(jobRunID, responseData));
  } catch (error) {
    // Handle errors appropriately
    const errorMsg = error.message || "An unexpected error occurred";
    callback(500, Requester.errored(jobRunID, { error: errorMsg }));
  }
};

// Wrapper for Google Cloud Platform Function
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// Wrapper for AWS Lambda (Legacy version)
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data);
  });
};

// Wrapper for AWS Lambda (Newer implementation)
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    });
  });
};

// Export for testing or Express.js use
module.exports.createRequest = createRequest;
