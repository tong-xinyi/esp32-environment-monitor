const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "environment.db");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
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
    fan_on INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const columns = db.prepare("PRAGMA table_info(readings);").all().map((column) => column.name);

if (!columns.includes("fan_on")) {
  db.exec("ALTER TABLE readings ADD COLUMN fan_on INTEGER NOT NULL DEFAULT 0;");
}

const insertReadingStatement = db.prepare(`
  INSERT INTO readings (
    temperature,
    humidity,
    light,
    raw_motion,
    occupied,
    seconds_since_motion,
    ac_on,
    fan_on
  )
  VALUES (
    @temperature,
    @humidity,
    @light,
    @rawMotion,
    @occupied,
    @secondsSinceMotion,
    @acOn,
    @fanOn
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
    fan_on AS fanOn,
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
    fan_on AS fanOn,
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
    fan_on AS fanOn,
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
    acOn: reading.acOn ? 1 : 0,
    fanOn: reading.fanOn ? 1 : 0
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
    acOn: Boolean(row.acOn),
    fanOn: Boolean(row.fanOn)
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
