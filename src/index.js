const express = require("express");
require("dotenv").config();
const db = require("./api/db");
const cors = require("cors");

const port = process.env.PORT || 3003;
const env = process.env.NODE_ENV || "development";
console.log(`Running in ${env} mode`);

const app = express();
app.use(cors());
if (env === "production") {
  app.use("/", express.static("./client/build"));
}
app.use("/api/db", db);
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
