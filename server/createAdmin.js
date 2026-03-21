const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const existing = await User.findOne({ email: "admin@test.com" });

    if (existing) {
      console.log("Admin already exists:", existing.email);
      process.exit();
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully");
    process.exit();
  })
  .catch(err => console.log(err));
