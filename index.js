const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  ...(process.env.NODE_ENV !== "production" && {
    user: "postgres",
    host: "localhost",
    database: "wedding_db",
    password: "Next@2024",
    port: 5432,
  }),
});

pool
  .connect()
  .then(() => console.log("connect database successs"))
  .catch((err) => console.error("Can not connect database", err));
app.post("/api/rsvp", async (req, res) => {
  try {
    const { name, attendance, guests_count, message } = req.body;
    const query =
      "INSERT INTO guests ( name, attendance, guests_count, message ) VALUES ($1, $2, $3, $4) RETURNING *";
    const values = [name, attendance, guests_count || 1, message || ""];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "រក្សាទុកទិន្នន័យជោគជ័យ!",
      data: result.rows[0],
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "មានបញ្ហាក្នុងការ Save", error });
  }
});


app.get("/api/rsvp", async (req, res) => {
  try {
    const allGuests = await pool.query("SELECT * FROM guests ORDER BY id DESC");
    res.status(200).json({ success: true, data: allGuests.rows });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ success: false, message: "មានបញ្ហាក្នុងការទាញទិន្នន័យ" });
  }
});

app.delete("/api/rsvp/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteQuery = "DELETE FROM guests WHERE id = $1 RETURNING *";
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញទិន្នន័យសម្រាប់លុបទេ" });
    }

    res.json({ success: true, message: "លុបទិន្នន័យបានជោគជ័យ!" });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server run on http://localhost:${PORT}`);
});
