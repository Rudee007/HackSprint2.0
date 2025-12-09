const express = require("express");
const axios = require("axios");
const router = express.Router();

// Chatbot Route
router.post("/panchakarma-chat", async (req, res) => {
  const { message, history } = req.body;

  try {
    const response = await axios.post("http://localhost:8001/chat", {
      message,
      history
    });

    res.json({ response: response.data.reply });

  } catch (error) {
    console.error("Chatbot Error:", error.message);
    res.status(500).json({ error: "Python AI service unavailable" });
  }
});

// Therapy Prediction Route
router.post("/panchakarma-ai", async (req, res) => {
  const { age, gender, complaint } = req.body;

  try {
    const response = await axios.post("http://localhost:8001/predict-therapy", {
      age,
      gender,
      complaint
    });

    res.json(response.data);

  } catch (error) {
    console.error("Prediction Error:", error.message);
    res.status(500).json({ error: "Python AI service unavailable" });
  }
});

module.exports = router;
