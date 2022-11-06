const express = require("express");
require("dotenv").config();
const db = require("./db");
const cors = require("cors");

const app = express();
app.use(cors());
const port = process.env.PORT || 3002;
// const env = process.env.NODE_ENV || "development";
app.use("/", db);
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
