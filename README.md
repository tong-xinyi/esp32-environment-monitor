# ESP32 Environment Monitor

This is an ESP32-based smart room monitoring project. It reads room
temperature, humidity, light level, and motion, then hosts a small web
dashboard on the ESP32 so the values can be viewed from a browser.

The project also simulates simple air-conditioner control with an LED. When
the room is occupied and the temperature is above the configured threshold,
the LED turns on.

## Features

- Temperature and humidity monitoring using AM2302 / DHT22
- Occupancy detection using AM312 PIR sensor
- Light intensity monitoring using BH1750
- Web dashboard hosted on ESP32
- JavaScript live data update
- Simulated AC control using LED

## Project Architecture

The Arduino sketch is organized around four main runtime steps:

- `readSensors()` reads the DHT22, BH1750, and PIR sensor inputs.
- `updateOccupancy()` updates the room occupancy state using the PIR sensor
  and a short hold time after the last motion event.
- `updateAcState()` applies the AC control rule and updates the simulated AC
  LED output.
- `buildJsonResponse()` builds the JSON payload returned by the `/data`
  endpoint for the web dashboard.

The ESP32 web server exposes two routes:

- `/` serves the dashboard HTML, CSS, and JavaScript.
- `/data` returns the latest sensor values and state as JSON.

The dashboard fetches `/data` every two seconds and updates the page without a
refresh.

## Hardware

- ESP32 development board
- AM2302 / DHT22 temperature and humidity sensor
- AM312 PIR motion sensor
- BH1750 light sensor
- LED and resistor
- Breadboard and jumper wires

## Pin Assignments

| Device | ESP32 Pin |
|---|---|
| AM2302 / DHT22 DATA | GPIO 4 |
| AM312 PIR OUT | GPIO 18 |
| BH1750 SDA | GPIO 21 |
| BH1750 SCL | GPIO 22 |
| Simulated AC LED | GPIO 26 |

More detailed wiring notes are available in [docs/wiring.md](docs/wiring.md).

## Software Requirements

- Arduino IDE or Arduino CLI
- ESP32 board support package for Arduino
- Libraries:
  - `DHT sensor library`
  - `BH1750`

The sketch uses standard ESP32 Arduino libraries for WiFi, I2C, and the web
server. No complex additional dependencies are required.

## Setup

1. Install the ESP32 board package in the Arduino IDE.
2. Install the `DHT sensor library` and `BH1750` libraries from the Arduino
   Library Manager.
3. Wire the sensors and LED using the pin assignments above.
4. Open `ESP32 environment monitor/ESP32 environment monitor.ino`.
5. Confirm the WiFi SSID and password in the sketch match your network.
6. Select the correct ESP32 board and port.
7. Upload the sketch.
8. Open the Serial Monitor at `115200` baud.
9. After the ESP32 connects to WiFi, open the printed IP address in a browser.

## Dashboard Data

The `/data` endpoint returns a JSON object with these fields:

| Field | Description |
|---|---|
| `temperature` | Temperature in degrees Celsius |
| `humidity` | Relative humidity percentage |
| `light` | Light level in lux |
| `rawMotion` | Direct PIR motion sensor reading |
| `occupied` | Occupancy state with motion hold time applied |
| `secondsSinceMotion` | Seconds since the last detected motion |
| `acOn` | Simulated AC LED state |

## Current Behavior

The project can read sensor data, display it on a web dashboard, and control a simulated AC LED based on room occupancy and temperature.
