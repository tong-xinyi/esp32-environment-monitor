const express = require("express");
const {
  dbPath,
  insertReading,
  listReadings,
  getLatestReading
} = require("./database");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "16kb" }));

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === 1 || value === "1" || value === "true") {
    return true;
  }

  if (value === 0 || value === "0" || value === "false") {
    return false;
  }

  return null;
}

function parseReading(body) {
  const temperature = toNumber(body.temperature);
  const humidity = toNumber(body.humidity);
  const light = toNumber(body.light);
  const secondsSinceMotion = toNumber(body.secondsSinceMotion);
  const rawMotion = toBoolean(body.rawMotion);
  const occupied = toBoolean(body.occupied);
  const acOn = toBoolean(body.acOn);

  if (
    temperature === null ||
    humidity === null ||
    light === null ||
    secondsSinceMotion === null ||
    rawMotion === null ||
    occupied === null ||
    acOn === null
  ) {
    return null;
  }

  return {
    temperature,
    humidity,
    light,
    rawMotion,
    occupied,
    secondsSinceMotion: Math.max(0, Math.round(secondsSinceMotion)),
    acOn
  };
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    database: dbPath
  });
});

app.post("/api/readings", (req, res) => {
  const reading = parseReading(req.body || {});

  if (!reading) {
    res.status(400).json({
      error: "Invalid reading payload"
    });
    return;
  }

  res.status(201).json(insertReading(reading));
});

app.get("/api/readings", (req, res) => {
  const requestedLimit = Number(req.query.limit || 50);
  const limit = Math.min(Math.max(Math.round(requestedLimit) || 50, 1), 200);
  res.json(listReadings(limit));
});

app.get("/api/latest", (req, res) => {
  const reading = getLatestReading();

  if (!reading) {
    res.status(404).json({
      error: "No readings saved yet"
    });
    return;
  }

  res.json(reading);
});

app.listen(port, () => {
  console.log(`ESP32 environment backend listening on http://localhost:${port}`);
});
