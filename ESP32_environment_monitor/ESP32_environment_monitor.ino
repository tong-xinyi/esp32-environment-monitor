#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <BH1750.h>
#include "DHT.h"

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* backendReadingsUrl = "http://YOUR_COMPUTER_IP:3000/api/readings";
const bool backendPostingEnabled = false;

unsigned long lastMotionTime = 0;
const unsigned long motionHoldTime = 30000;
unsigned long lastBackendPostTime = 0;
const unsigned long backendPostInterval = 10000;
const float acTemperatureThreshold = 28.0;
bool acOn = false;
bool acManualOverride = false;
const float fanTemperatureThreshold = 28.0;
bool fanOn = false;

#define DHTPIN 4
#define DHTTYPE DHT22
#define PIR_PIN 18
#define AC_LED_PIN 26
#define FAN_CONTROL_PIN 27

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
WebServer server(80);

struct SensorReadings {
  float temperature;
  float humidity;
  float lux;
  int rawMotion;
};

SensorReadings readSensors() {
  SensorReadings readings;
  readings.temperature = dht.readTemperature();
  readings.humidity = dht.readHumidity();
  readings.lux = lightMeter.readLightLevel();
  readings.rawMotion = digitalRead(PIR_PIN);

  return readings;
}

bool updateOccupancy(int rawMotion) {
  if (rawMotion == HIGH) {
    lastMotionTime = millis();
  }

  return millis() - lastMotionTime < motionHoldTime;
}

void writeAcOutput() {
  digitalWrite(AC_LED_PIN, acOn ? HIGH : LOW);
}

void updateAcState(float temperature, bool occupied) {
  if (!acManualOverride) {
    acOn = occupied && temperature >= acTemperatureThreshold;
  }

  writeAcOutput();
}

void updateFanState(float temperature) {
  fanOn = temperature >= fanTemperatureThreshold;
  digitalWrite(FAN_CONTROL_PIN, fanOn ? HIGH : LOW);
}

String buildJsonResponse(const SensorReadings& readings, bool occupied, bool acOn) {
  String json = "{";
  json += "\"temperature\":";
  json += readings.temperature;
  json += ",";
  json += "\"humidity\":";
  json += readings.humidity;
  json += ",";
  json += "\"light\":";
  json += readings.lux;
  json += ",";
  json += "\"rawMotion\":";
  json += readings.rawMotion == HIGH ? "true" : "false";
  json += ",";
  json += "\"occupied\":";
  json += occupied ? "true" : "false";
  json += ",";
  json += "\"secondsSinceMotion\":";
  json += (millis() - lastMotionTime) / 1000;
  json += ",";
  json += "\"acOn\":";
  json += acOn ? "true" : "false";
  json += ",";
  json += "\"fanOn\":";
  json += fanOn ? "true" : "false";
  json += "}";

  return json;
}

void sendReadingToBackend(const String& json) {
  if (!backendPostingEnabled || WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  http.begin(backendReadingsUrl);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(json);
  Serial.print("Backend POST response: ");
  Serial.println(responseCode);

  http.end();
}

void postReadingToBackend() {
  SensorReadings readings = readSensors();
  bool occupied = updateOccupancy(readings.rawMotion);
  updateAcState(readings.temperature, occupied);
  updateFanState(readings.temperature);
  String json = buildJsonResponse(readings, occupied, acOn);

  sendReadingToBackend(json);
}

void updateBackendPosting() {
  if (millis() - lastBackendPostTime < backendPostInterval) {
    return;
  }

  lastBackendPostTime = millis();
  postReadingToBackend();
}

void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ESP32 Environment Monitor</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      background: #f3f4f6;
      color: #1f2937;
    }

    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 6px;
    }

    .subtitle {
      color: #6b7280;
      margin-top: 0;
      margin-bottom: 22px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 14px;
    }

    .card {
      background: white;
      padding: 18px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }

    .label {
      font-weight: bold;
      color: #4b5563;
      display: block;
      margin-bottom: 8px;
    }

    .value {
      font-size: 28px;
      font-weight: bold;
    }

    .status {
      font-size: 28px;
      font-weight: bold;
    }

    .controls {
      margin-top: 14px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .ac-card {
      margin-top: 14px;
    }

    button {
      border: 0;
      border-radius: 8px;
      padding: 12px 18px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      color: white;
    }

    .on-button {
      background: #15803d;
    }

    .off-button {
      background: #b91c1c;
    }

    .auto-button {
      background: #2563eb;
    }

  </style>
</head>

<body>
  <main>
    <h1>ESP32 Environment Monitor</h1>
    <p class="subtitle">Live room sensor dashboard with manual simulated AC control.</p>

    <section class="grid">
      <div class="card">
        <span class="label">Temperature</span>
        <span id="temperature" class="value">--</span> &deg;C
      </div>

      <div class="card">
        <span class="label">Humidity</span>
        <span id="humidity" class="value">--</span> %
      </div>

      <div class="card">
        <span class="label">Light</span>
        <span id="light" class="value">--</span> lux
      </div>

      <div class="card">
        <span class="label">Motion Sensor</span>
        <span id="rawMotion" class="value">--</span>
      </div>

      <div class="card">
        <span class="label">Room Status</span>
        <span id="occupied" class="status">--</span>
      </div>

      <div class="card">
        <span class="label">Seconds Since Last Motion</span>
        <span id="secondsSinceMotion" class="value">--</span> s
      </div>
    </section>

    <section class="card ac-card">
      <span class="label">Fan Status</span>
      <span id="fanStatus" class="status">--</span>
      <p class="subtitle">Fan turns on automatically at 28 &deg;C or higher.</p>
    </section>

    <section class="card ac-card">
      <span class="label">Simulated AC Status</span>
      <span id="acStatus" class="status">--</span>
      <div class="controls">
        <button class="on-button" onclick="setAc(true)">Turn AC ON</button>
        <button class="off-button" onclick="setAc(false)">Turn AC OFF</button>
        <button class="auto-button" onclick="setAcAuto()">Return to Auto</button>
      </div>
    </section>
  </main>

  <script>
    async function updateData() {
      try {
        const response = await fetch('/data');
        const data = await response.json();

        document.getElementById('temperature').textContent = data.temperature.toFixed(2);
        document.getElementById('humidity').textContent = data.humidity.toFixed(2);
        document.getElementById('light').textContent = data.light.toFixed(2);

        document.getElementById('rawMotion').textContent = data.rawMotion ? 'Detected' : 'None';
        document.getElementById('occupied').textContent = data.occupied ? 'Occupied' : 'Empty';
        document.getElementById('acStatus').textContent = data.acOn ? 'ON' : 'OFF';
        document.getElementById('fanStatus').textContent = data.fanOn ? 'ON' : 'OFF';
        document.getElementById('secondsSinceMotion').textContent = data.secondsSinceMotion;
      } catch (error) {
        console.log('Failed to fetch sensor data:', error);
      }
    }

    async function setAc(turnOn) {
      try {
        await fetch(turnOn ? '/ac/on' : '/ac/off');
        updateData();
      } catch (error) {
        console.log('Failed to update AC state:', error);
      }
    }

    async function setAcAuto() {
      try {
        await fetch('/ac/auto');
        updateData();
      } catch (error) {
        console.log('Failed to return AC to auto mode:', error);
      }
    }

    updateData();
    setInterval(updateData, 2000);
  </script>
</body>
</html>
)rawliteral";

  server.send(200, "text/html", html);
}

void handleData() {
  SensorReadings readings = readSensors();
  bool occupied = updateOccupancy(readings.rawMotion);
  updateAcState(readings.temperature, occupied);
  updateFanState(readings.temperature);
  String json = buildJsonResponse(readings, occupied, acOn);

  server.send(200, "application/json", json);
}

void handleAcOn() {
  acManualOverride = true;
  acOn = true;
  writeAcOutput();
  server.send(200, "text/plain", "AC ON");
}

void handleAcOff() {
  acManualOverride = true;
  acOn = false;
  writeAcOutput();
  server.send(200, "text/plain", "AC OFF");
}

void handleAcAuto() {
  SensorReadings readings = readSensors();
  bool occupied = updateOccupancy(readings.rawMotion);
  acManualOverride = false;
  updateAcState(readings.temperature, occupied);
  server.send(200, "text/plain", "AC AUTO");
}

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(AC_LED_PIN, OUTPUT);
  pinMode(FAN_CONTROL_PIN, OUTPUT);
  digitalWrite(AC_LED_PIN, LOW);
  digitalWrite(FAN_CONTROL_PIN, LOW);

  dht.begin();

  Wire.begin(21, 22);
  lightMeter.begin();

  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.on("/ac/on", handleAcOn);
  server.on("/ac/off", handleAcOff);
  server.on("/ac/auto", handleAcAuto);
  server.begin();

  Serial.println("Web server started.");
}

void loop() {
  server.handleClient();
  updateBackendPosting();
}
