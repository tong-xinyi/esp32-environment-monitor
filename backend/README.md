# ESP32 Environment Backend

This is a small Node.js backend for saving ESP32 environment readings to a
SQLite database.

The ESP32 does not post to this backend yet. This backend is the next step
toward a full-stack version of the project.

## Setup

Install dependencies:

```bash
npm install
```

Start the API:

```bash
npm start
```

The server runs on:

```text
http://localhost:3000
```

SQLite data is saved locally in:

```text
backend/data/environment.db
```

The `data/` folder is ignored by Git so local sensor history is not committed.

## API Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Check that the backend is running |
| `POST` | `/api/readings` | Save one ESP32 reading |
| `GET` | `/api/latest` | Return the latest saved reading |
| `GET` | `/api/readings?limit=50` | Return recent saved readings |

## Example Reading

```json
{
  "temperature": 27.5,
  "humidity": 60.2,
  "light": 120.5,
  "rawMotion": true,
  "occupied": true,
  "secondsSinceMotion": 3,
  "acOn": false
}
```

## Manual Test

With the backend running, save a fake reading:

```bash
curl -X POST http://localhost:3000/api/readings ^
  -H "Content-Type: application/json" ^
  -d "{\"temperature\":27.5,\"humidity\":60.2,\"light\":120.5,\"rawMotion\":true,\"occupied\":true,\"secondsSinceMotion\":3,\"acOn\":false}"
```

Then read the latest saved value:

```bash
curl http://localhost:3000/api/latest
```
