const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "environment.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    light REAL NOT NULL,
    raw_motion INTEGER NOT NULL,
    occupied INTEGER NOT NULL,
    seconds_since_motion INTEGER NOT NULL,
    ac_on INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertReadingStatement = db.prepare(`
  INSERT INTO readings (
    temperature,
    humidity,
    light,
    raw_motion,
    occupied,
    seconds_since_motion,
    ac_on
  )
  VALUES (
    @temperature,
    @humidity,
    @light,
    @rawMotion,
    @occupied,
    @secondsSinceMotion,
    @acOn
  );
`);

const listReadingsStatement = db.prepare(`
  SELECT
    id,
    temperature,
    humidity,
    light,
    raw_motion AS rawMotion,
    occupied,
    seconds_since_motion AS secondsSinceMotion,
    ac_on AS acOn,
    created_at AS createdAt
  FROM readings
  ORDER BY id DESC
  LIMIT ?;
`);

const latestReadingStatement = db.prepare(`
  SELECT
    id,
    temperature,
    humidity,
    light,
    raw_motion AS rawMotion,
    occupied,
    seconds_since_motion AS secondsSinceMotion,
    ac_on AS acOn,
    created_at AS createdAt
  FROM readings
  ORDER BY id DESC
  LIMIT 1;
`);

const readingByIdStatement = db.prepare(`
  SELECT
    id,
    temperature,
    humidity,
    light,
    raw_motion AS rawMotion,
    occupied,
    seconds_since_motion AS secondsSinceMotion,
    ac_on AS acOn,
    created_at AS createdAt
  FROM readings
  WHERE id = ?;
`);

function toStoredReading(reading) {
  return {
    temperature: reading.temperature,
    humidity: reading.humidity,
    light: reading.light,
    rawMotion: reading.rawMotion ? 1 : 0,
    occupied: reading.occupied ? 1 : 0,
    secondsSinceMotion: reading.secondsSinceMotion,
    acOn: reading.acOn ? 1 : 0
  };
}

function toApiReading(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    rawMotion: Boolean(row.rawMotion),
    occupied: Boolean(row.occupied),
    acOn: Boolean(row.acOn)
  };
}

function insertReading(reading) {
  const result = insertReadingStatement.run(toStoredReading(reading));
  return toApiReading(readingByIdStatement.get(result.lastInsertRowid));
}

function listReadings(limit) {
  return listReadingsStatement.all(limit).map(toApiReading);
}

function getLatestReading() {
  return toApiReading(latestReadingStatement.get());
}

module.exports = {
  dbPath,
  insertReading,
  listReadings,
  getLatestReading
};
