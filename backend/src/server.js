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
  const fanOn = body.fanOn === undefined ? false : toBoolean(body.fanOn);

  if (
    temperature === null ||
    humidity === null ||
    light === null ||
    secondsSinceMotion === null ||
    rawMotion === null ||
    occupied === null ||
    acOn === null ||
    fanOn === null
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
    acOn,
    fanOn
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
    * { box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      color: #1f2937;
      background: #f3f4f6;
    }

    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 24px;
    }

    header { margin-bottom: 20px; }
    h1 { margin-bottom: 6px; }

    .subtitle {
      margin: 0;
      color: #6b7280;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }

    .card,
    .panel {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }

    .card { padding: 18px; }

    .label {
      display: block;
      margin-bottom: 8px;
      color: #6b7280;
      font-size: 14px;
      font-weight: bold;
    }

    .value {
      font-size: 26px;
      font-weight: bold;
    }

    .unit {
      color: #6b7280;
      font-size: 15px;
      margin-left: 4px;
    }

    .chart-panel {
      margin-bottom: 18px;
      padding-bottom: 10px;
    }

    #trendChart {
      display: block;
      width: 100%;
      height: 260px;
      background: white;
    }

    .chart-line-temp { stroke: #b91c1c; }
    .chart-line-humidity { stroke: #2563eb; }
    .chart-grid { stroke: #e5e7eb; }
    .chart-text { fill: #4b5563; font-size: 12px; }
    .chart-empty { fill: #6b7280; font-size: 14px; }

    .panel { overflow: hidden; }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 18px;
      border-bottom: 1px solid #e5e7eb;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 18px;
    }

    .updated-at {
      color: #6b7280;
      font-size: 14px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      white-space: nowrap;
    }

    th {
      color: #4b5563;
      background: #f9fafb;
      font-size: 13px;
    }

    tr:last-child td { border-bottom: 0; }

    code {
      background: #eef2ff;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .empty {
      padding: 20px;
      color: #6b7280;
    }

    .status-ok {
      color: #15803d;
      font-weight: bold;
    }

    .status-off {
      color: #b91c1c;
      font-weight: bold;
    }

    @media (max-width: 720px) {
      table {
        display: block;
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>ESP32 Environment Backend</h1>
      <p class="subtitle">SQLite history dashboard for readings posted by the ESP32.</p>
    </header>

    <section class="grid">
      <div class="card">
        <span class="label">Temperature</span>
        <span id="temperature" class="value">--</span><span class="unit">C</span>
      </div>
      <div class="card">
        <span class="label">Humidity</span>
        <span id="humidity" class="value">--</span><span class="unit">%</span>
      </div>
      <div class="card">
        <span class="label">Light</span>
        <span id="light" class="value">--</span><span class="unit">lux</span>
      </div>
      <div class="card">
        <span class="label">Room</span>
        <span id="occupied" class="value">--</span>
      </div>
      <div class="card">
        <span class="label">Simulated AC</span>
        <span id="acOn" class="value">--</span>
      </div>
      <div class="card">
        <span class="label">Fan</span>
        <span id="fanOn" class="value">--</span>
      </div>
    </section>

    <section class="panel chart-panel">
      <div class="panel-header">
        <h2>Temperature and Humidity Trend</h2>
        <span class="updated-at">Recent saved readings</span>
      </div>
      <svg id="trendChart" viewBox="0 0 720 260" role="img" aria-label="Temperature and humidity trend chart"></svg>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Recent Readings</h2>
        <span id="updatedAt" class="updated-at">Waiting for data</span>
      </div>
      <div id="tableWrap" class="empty">
        No readings saved yet. Start the ESP32 backend posting feature, or POST a test reading to <code>/api/readings</code>.
      </div>
    </section>
  </main>

  <script>
    function formatNumber(value, digits) {
      return Number(value).toFixed(digits);
    }

    function formatDateTime(value) {
      const utcValue = value.replace(" ", "T") + "Z";
      return new Date(utcValue).toLocaleString();
    }

    function formatBoolean(value, trueText, falseText) {
      return value ? trueText : falseText;
    }

    function renderLatest(reading) {
      if (!reading) {
        return;
      }

      document.getElementById("temperature").textContent = formatNumber(reading.temperature, 1);
      document.getElementById("humidity").textContent = formatNumber(reading.humidity, 1);
      document.getElementById("light").textContent = formatNumber(reading.light, 1);
      document.getElementById("occupied").textContent = formatBoolean(reading.occupied, "Occupied", "Empty");
      document.getElementById("acOn").textContent = formatBoolean(reading.acOn, "ON", "OFF");
      document.getElementById("fanOn").textContent = formatBoolean(reading.fanOn, "ON", "OFF");
    }

    function renderTrendChart(readings) {
      const svg = document.getElementById("trendChart");
      const recent = readings.slice().reverse();
      const width = 720;
      const height = 260;
      const padding = { top: 24, right: 22, bottom: 34, left: 46 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;

      if (recent.length < 2) {
        svg.innerHTML = '<text class="chart-empty" x="46" y="132">Need at least two saved readings to draw a trend.</text>';
        return;
      }

      const temperatures = recent.map((reading) => Number(reading.temperature));
      const humidities = recent.map((reading) => Number(reading.humidity));
      const allValues = temperatures.concat(humidities);
      const minValue = Math.floor(Math.min.apply(null, allValues) - 2);
      const maxValue = Math.ceil(Math.max.apply(null, allValues) + 2);
      const range = Math.max(1, maxValue - minValue);

      function xFor(index) {
        return padding.left + (index / Math.max(1, recent.length - 1)) * plotWidth;
      }

      function yFor(value) {
        return padding.top + ((maxValue - value) / range) * plotHeight;
      }

      function pointsFor(values) {
        return values.map((value, index) => xFor(index).toFixed(1) + "," + yFor(value).toFixed(1)).join(" ");
      }

      let grid = "";
      for (let index = 0; index <= 4; index += 1) {
        const value = minValue + (range / 4) * index;
        const y = yFor(value);
        grid += '<line class="chart-grid" x1="' + padding.left + '" y1="' + y + '" x2="' + (width - padding.right) + '" y2="' + y + '" />';
        grid += '<text class="chart-text" x="8" y="' + (y + 4) + '">' + value.toFixed(0) + '</text>';
      }

      const firstTime = formatDateTime(recent[0].createdAt);
      const lastTime = formatDateTime(recent[recent.length - 1].createdAt);

      svg.innerHTML = grid +
        '<polyline class="chart-line-temp" points="' + pointsFor(temperatures) + '" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
        '<polyline class="chart-line-humidity" points="' + pointsFor(humidities) + '" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
        '<text class="chart-text" x="' + padding.left + '" y="244">' + firstTime + '</text>' +
        '<text class="chart-text" x="520" y="244">' + lastTime + '</text>' +
        '<text class="chart-text" x="540" y="24">Temp C</text>' +
        '<line class="chart-line-temp" x1="590" y1="20" x2="630" y2="20" stroke-width="3" />' +
        '<text class="chart-text" x="540" y="44">Humidity %</text>' +
        '<line class="chart-line-humidity" x1="610" y1="40" x2="650" y2="40" stroke-width="3" />';
    }
    function renderTable(readings) {
      const tableWrap = document.getElementById("tableWrap");

      if (!readings.length) {
        tableWrap.className = "empty";
        tableWrap.innerHTML = "No readings saved yet. Start the ESP32 backend posting feature, or POST a test reading to <code>/api/readings</code>.";
        return;
      }

      let rows = "";
      readings.forEach((reading) => {
        rows += "<tr>";
        rows += "<td>" + formatDateTime(reading.createdAt) + "</td>";
        rows += "<td>" + formatNumber(reading.temperature, 1) + " C</td>";
        rows += "<td>" + formatNumber(reading.humidity, 1) + "%</td>";
        rows += "<td>" + formatNumber(reading.light, 1) + " lux</td>";
        rows += "<td>" + formatBoolean(reading.rawMotion, "Motion", "None") + "</td>";
        rows += "<td>" + formatBoolean(reading.occupied, "Occupied", "Empty") + "</td>";
        rows += "<td class=\\"" + (reading.acOn ? "status-ok" : "status-off") + "\\">" + formatBoolean(reading.acOn, "ON", "OFF") + "</td>";
        rows += "<td class=\\"" + (reading.fanOn ? "status-ok" : "status-off") + "\\">" + formatBoolean(reading.fanOn, "ON", "OFF") + "</td>";
        rows += "</tr>";
      });

      tableWrap.className = "";
      tableWrap.innerHTML = "<table>" +
        "<thead>" +
          "<tr>" +
            "<th>Time</th>" +
            "<th>Temp</th>" +
            "<th>Humidity</th>" +
            "<th>Light</th>" +
            "<th>Motion</th>" +
            "<th>Room</th>" +
            "<th>AC</th>" +
            "<th>Fan</th>" +
          "</tr>" +
        "</thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table>";
    }

    async function refreshDashboard() {
      try {
        const response = await fetch("/api/readings?limit=20");
        const readings = await response.json();

        renderLatest(readings[0]);
        renderTable(readings);
        renderTrendChart(readings);
        document.getElementById("updatedAt").textContent = "Updated " + new Date().toLocaleTimeString();
      } catch (error) {
        document.getElementById("updatedAt").textContent = "Could not load readings";
        console.log("Failed to load backend readings:", error);
      }
    }

    refreshDashboard();
    setInterval(refreshDashboard, 5000);
  </script>
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
