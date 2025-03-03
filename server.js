const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // ✅ Ensure JSON parsing enabled
app.use(express.urlencoded({ extended: true })); // ✅ URL Encoded data bhi parse karega

// ✅ Debugging Middleware
app.use((req, res, next) => {
  console.log("✅ Received request:", req.method, req.url);
  console.log("✅ Headers:", req.headers);
  console.log("✅ Body:", req.body); // Debugging ke liye body print karega
  next();
});

// 📍 Geocode API
app.post("/geocode", async (req, res) => {
  if (!req.body || !req.body.location) {
    console.log("❌ Request body is missing");
    return res.status(400).json({ message: "Location is required" });
  }

  try {
    const { location } = req.body;
    console.log(`🔍 Searching for location: ${location}`);

    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`);

    if (response.data.length === 0) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.json(response.data[0]);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🚀 Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
