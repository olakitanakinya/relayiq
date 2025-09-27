const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.json());

// Use environment variables individually for Kubernetes
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "relayiq",
  password: process.env.DB_PASSWORD || "password",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
});

// Auto-create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS handovers (
    id SERIAL PRIMARY KEY,
    title TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

app.get("/handovers", async (_, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM handovers ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/handovers", async (req, res) => {
  const { title, details } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO handovers (title, details) VALUES ($1, $2) RETURNING *",
      [title, details]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
