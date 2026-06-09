const http = require("http");
const {
  dbPath,
  insertReading,
  listReadings,
  getLatestReading
} = require("./database");

const port = Number(process.env.PORT || 3000);

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

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html)
  });
  res.end(html);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 16 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function renderHomePage() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ESP32 Environment Backend</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #1f2937;
      background: #f3f4f6;
    }

    main {
      max-width: 760px;
      margin: 0 auto;
      background: white;
      padding: 24px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }

    code {
      background: #eef2ff;
      padding: 2px 6px;
      border-radius: 4px;
    }

    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <main>
    <h1>ESP32 Environment Backend</h1>
    <p>This backend is running and ready to store ESP32 readings in SQLite.</p>
    <ul>
      <li><code>GET /health</code> checks server status.</li>
      <li><code>POST /api/readings</code> saves one reading.</li>
      <li><code>GET /api/latest</code> returns the latest saved reading.</li>
      <li><code>GET /api/readings?limit=50</code> returns recent readings.</li>
    </ul>
  </main>
</body>
</html>`;
}

async function handlePostReading(req, res) {
  let body;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, {
      error: "Invalid JSON body"
    });
    return;
  }

  const reading = parseReading(body);

  if (!reading) {
    sendJson(res, 400, {
      error: "Invalid reading payload"
    });
    return;
  }

  sendJson(res, 201, insertReading(reading));
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/") {
    sendHtml(res, 200, renderHomePage());
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      database: dbPath
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/readings") {
    handlePostReading(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/readings") {
    const requestedLimit = Number(url.searchParams.get("limit") || 50);
    const limit = Math.min(Math.max(Math.round(requestedLimit) || 50, 1), 200);
    sendJson(res, 200, listReadings(limit));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/latest") {
    const reading = getLatestReading();

    if (!reading) {
      sendJson(res, 404, {
        error: "No readings saved yet"
      });
      return;
    }

    sendJson(res, 200, reading);
    return;
  }

  sendJson(res, 404, {
    error: "Route not found"
  });
}

http.createServer(handleRequest).listen(port, () => {
  console.log(`ESP32 environment backend listening on http://localhost:${port}`);
});
