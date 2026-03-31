const express = require("express");
const helmet = require("helmet");
const { router } = require("./routes");
const { notFound, errorHandler } = require("./middleware");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }

  next();
});

app.use(express.json());
app.use(router);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
