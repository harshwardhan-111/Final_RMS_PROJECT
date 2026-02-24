const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("AI Review Management System API Running...");
});
const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);
const submissionRoutes = require("./routes/submissionRoutes");
app.use("/api/submissions", submissionRoutes);
const path = require("path");
app.use(express.static(path.join(__dirname, "../client")));
app.use("/uploads", express.static(__dirname + "/uploads"));

module.exports = app;
