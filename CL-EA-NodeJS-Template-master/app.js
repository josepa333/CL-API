const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");
const createRequest = require("./index").createRequest;

const app = express();
const port = process.env.EA_PORT || 8080;
const prisma = new PrismaClient();

app.use(bodyParser.json());

app.post("/", (req, res) => {
  console.log("POST Data: ", req.body);
  createRequest(req.body, (status, result) => {
    console.log("Result: ", result);
    res.status(status).json(result);
  });
});

app.post("/Transaction", async (req, res) => {
  console.log("POST Data: ", req.body);
  const transaction = await prisma.transaction.create({
    data: {
      title: req.body.title || "No Title",
      amount: req.body.amount,
    },
  });

  res.json({ message: "Request received", data: transaction });
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
