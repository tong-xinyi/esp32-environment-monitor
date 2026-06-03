#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <BH1750.h>
#include "DHT.h"

const char* ssid = "31-2";
const char* password = "Hello202101";

unsigned long lastMotionTime = 0;
const unsigned long motionHoldTime = 30000;

#define DHTPIN 4
#define DHTTYPE DHT22
#define PIR_PIN 18
#define AC_LED_PIN 26

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

bool updateAcState(bool occupied, float temperature) {
  bool acOn = occupied && temperature > 28;
  digitalWrite(AC_LED_PIN, acOn ? HIGH : LOW);

  return acOn;
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
  json += "}";

  return json;
}

void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ESP32 Environment Monitor</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 30px;
      background: #f5f5f5;
    }

    h1 {
      font-size: 36px;
    }

    .card {
      background: white;
      padding: 18px;
      margin: 12px 0;
      border-radius: 12px;
      font-size: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .label {
      font-weight: bold;
    }

    .status {
      font-size: 28px;
      font-weight: bold;
    }
  </style>
</head>

<body>
  <h1>ESP32 Environment Monitor</h1>

  <div class="card">
    <span class="label">Temperature:</span>
    <span id="temperature">--</span> &deg;C
  </div>

  <div class="card">
    <span class="label">Humidity:</span>
    <span id="humidity">--</span> %
  </div>

  <div class="card">
    <span class="label">Light:</span>
    <span id="light">--</span> lux
  </div>

  <div class="card">
    <span class="label">Motion Sensor:</span>
    <span id="rawMotion">--</span>
  </div>

  <div class="card">
    <span class="label">Room Status:</span>
    <span id="occupied" class="status">--</span>
  </div>

  <div class="card">
    <span class="label">AC Status:</span>
    <span id="acStatus" class="status">--</span>
  </div>

  <div class="card">
    <span class="label">Seconds Since Last Motion:</span>
    <span id="secondsSinceMotion">--</span> s
  </div>

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
        document.getElementById('secondsSinceMotion').textContent = data.secondsSinceMotion;
      } catch (error) {
        console.log('Failed to fetch sensor data:', error);
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
  bool acOn = updateAcState(occupied, readings.temperature);
  String json = buildJsonResponse(readings, occupied, acOn);

  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(AC_LED_PIN, OUTPUT);
  digitalWrite(AC_LED_PIN, LOW);

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
  server.begin();

  Serial.println("Web server started.");
}

void loop() {
  server.handleClient();
}
