const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");

function init() {
  if (fs.existsSync(dbFile)) return;
  const db = new sqlite3.Database(dbFile);
  const sql = fs.readFileSync("init.sql", "utf8");
  db.serialize(() => {
    db.run(sql);
  });
  db.close();
}

function reset() {
  const db = new sqlite3.Database(dbFile);
  const sql = fs.readFileSync("reset.sql", "utf8");
  db.serialize(() => {
    db.run(sql);
  });
  db.close();
}

// Set up the database
const dbFile = process.env.DB_FILE || path.join(__dirname, "db.sqlite");
init();

const router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post("/reset", (req, res) => {
  reset();
  res.send("Database reset");
});

router.post("/", (req, res) => {
  const lastUpdatedAt = parseInt(req.query.lastUpdatedAt) || 0;
  // Update database with new data
  const objects = req.body;
  const keys = Object.keys(objects);
  const values = Object.values(objects).map((v) => JSON.stringify(v));
  const sqlInsert =
    "INSERT OR REPLACE INTO object (key, value) VALUES " + keys.map((k) => "(?, ?)").join(", ");
  const params = [];
  for (let i = 0; i < keys.length; i++) {
    params.push(keys[i]);
    params.push(values[i]);
  }
  const db = new sqlite3.Database(dbFile);
  db.run(sqlInsert, params, (result, err) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      // Return the updated data
      const sql = "SELECT * FROM object WHERE updated_at > $lastUpdatedAt";
      db.all(sql, { $lastUpdatedAt: lastUpdatedAt }, (err, rows) => {
        if (err) res.status(500).send({ error: err });
        const objects = {};
        rows.forEach((row) => {
          objects[row.key] = JSON.parse(row.value);
        });
        res.json(objects);
      });
    }
  });
});

// router.get("/", (req, res) => {
//   const objects = req.body;
//   const keys = Object.keys(objects);
//   const sql = "SELECT * FROM object WHERE key IN (" + keys.map((k) => "?").join(", ") + ")";
//   const db = new sqlite3.Database(dbFile);
//   db.all(sql, keys, (err, rows) => {
//     if (err) res.status(500).send({ error: err });
//     const objects = {};
//     const meta = {};
//     rows.forEach((row) => {
//       objects[row.key] = JSON.parse(row.value);
//       meta[row.key] = { ...row, value: undefined };
//     });
//     res.json({ objects, meta });
//   });
// });

// router.get("/all", (req, res) => {
//   const db = new sqlite3.Database(dbFile);
//   db.all("select * from object", {}, (err, rows) => {
//     if (err) res.status(500).send({ error: err });
//     const objects = {};
//     const meta = {};
//     rows.forEach((row) => {
//       objects[row.key] = JSON.parse(row.value);
//       meta[row.key] = { ...row, value: undefined };
//     });
//     res.json({ objects, meta });
//   });
// });

// router.get("/new", (req, res) => {
//   const since = parseInt(req.query.since);
//   const sql = "SELECT * FROM object WHERE updated_at > $since";
//   const db = new sqlite3.Database(dbFile);
//   db.all(sql, { $since: since }, (err, rows) => {
//     if (err) res.status(500).send({ error: err });
//     const objects = {};
//     const meta = {};
//     rows.forEach((row) => {
//       objects[row.key] = JSON.parse(row.value);
//       meta[row.key] = { ...row, value: undefined };
//     });
//     res.json({ objects, meta });
//   });
// });

// router.get("/health", (req, res) => {
//   res.json({ status: "ok" });
// });

module.exports = router;
