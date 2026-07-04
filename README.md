# ESP32 Environment Monitor

This is an ESP32-based smart room monitoring project. It reads room
temperature, humidity, light level, and motion, then hosts a small local web
dashboard on the ESP32 so the values can be viewed from a browser.

The project also includes a beginner-friendly simulated air-conditioner
control feature. The AC is represented by an LED: it turns on automatically
when the temperature reaches 28 C, and the dashboard can manually turn it on
or off. It does not control a real air-conditioner or any high-voltage
hardware.

## Features

- Temperature and humidity monitoring using AM2302 / DHT22
- Occupancy detection using AM312 PIR sensor
- Light intensity monitoring using BH1750
- Web dashboard hosted on ESP32
- JavaScript live data update
- Automatic simulated AC control at 28 C with manual ON/OFF override

## Project Architecture

The Arduino sketch is organized around a few small functions:

- `readSensors()` reads the DHT22, BH1750, and PIR sensor inputs.
- `updateOccupancy()` updates the room occupancy state using the PIR sensor
  and a short hold time after the last motion event.
- `updateAcState()` applies the automatic 28 C AC rule unless manual override
  is active, then writes the current simulated AC state to the LED output.
- `buildJsonResponse()` builds the JSON payload returned by the `/data`
  endpoint for the web dashboard.

The ESP32 web server exposes two routes:

- `/` serves the dashboard HTML, CSS, and JavaScript.
- `/data` returns the latest sensor values and state as JSON.
- `/ac/on` turns the simulated AC LED on.
- `/ac/off` turns the simulated AC LED off.
- `/ac/auto` returns the simulated AC to automatic temperature control.

The dashboard fetches `/data` every two seconds and updates the page without a
refresh. The AC buttons call `/ac/on`, `/ac/off`, or `/ac/auto`, then refresh
the displayed state.

The repository also includes a small `backend/` folder for the next
full-stack step. It provides a Node.js API that can save environment readings
to SQLite. The ESP32 does not post data to that backend yet.

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

- Arduino IDE
- ESP32 board support package for Arduino
- Libraries:
  - `DHT sensor library`
  - `BH1750`
- Optional backend tools:
  - Node.js
  - npm

The sketch uses standard ESP32 Arduino libraries for WiFi, I2C, and the web
server. No complex additional dependencies are required.

## WiFi Configuration

The WiFi network name and password are defined near the top of the Arduino
sketch:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```



Update these values only when you need the ESP32 to connect to a different
network. The rest of the WiFi connection logic should stay simple and
compatible with Arduino IDE.

## Arduino IDE Upload Steps

1. Install the ESP32 board package in the Arduino IDE.
2. Install the `DHT sensor library` and `BH1750` libraries from the Arduino
   Library Manager.
3. Wire the sensors and LED using the pin assignments above.
4. Open `ESP32_environment_monitor/ESP32_environment_monitor.ino`.
5. Confirm the WiFi SSID and password in the sketch match your network.
6. Select the correct ESP32 board and port.
7. Upload the sketch.
8. Open the Serial Monitor at `115200` baud.
9. After the ESP32 connects to WiFi, open the printed IP address in a browser.

## Available Routes

| Route | Purpose |
|---|---|
| `/` | Shows the local web dashboard |
| `/data` | Returns sensor, occupancy, and simulated AC state as JSON |
| `/ac/on` | Turns the simulated AC LED on |
| `/ac/off` | Turns the simulated AC LED off |
| `/ac/auto` | Returns the simulated AC to automatic 28 C control |

## JSON Data

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

## Backend History API

The `backend/` folder contains a small Node.js API for saving readings to
SQLite.

Backend routes:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Check that the backend is running |
| `POST` | `/api/readings` | Save one environment reading |
| `GET` | `/api/latest` | Return the latest saved reading |
| `GET` | `/api/readings?limit=50` | Return recent saved readings |

Run it from the backend folder:

```bash
cd backend
node src/server.js
```

The SQLite database is created locally at `backend/data/environment.db`. This
local data folder is ignored by Git.

## Current Limitations

- The AC feature is only simulated with an LED.
- Automatic AC control currently uses a simple 28 C threshold.
- Manual ON/OFF overrides the automatic rule until `/ac/auto` is used or the
  ESP32 restarts.
- The backend can store readings, but the ESP32 firmware does not post to it
  yet.
- The project does not control real AC mains power, relays, or high-voltage
  devices.
- The PIR sensor detects motion, not continuous human presence. Occupancy uses
  a hold time after the last motion event.
- Sensor error handling is still basic.
- The dashboard is hosted directly from the ESP32, so it is intentionally
  simple and lightweight.

## Future Development Plan

- Improve occupancy detection so the room does not immediately appear empty
  when a person stays still.
- Improve automatic simulated AC recommendations or control, such as:
  - include occupancy in the AC decision
  - turn or recommend AC off when the room is empty for a while
- Add ESP32-to-backend posting so readings are saved automatically.
- Add clearer visual status indicators, possibly traffic-light style LEDs.
- Consider logging readings to a server or database in a later full-stack
  version.
- Build a stronger IoT portfolio project around hardware, embedded firmware,
  dashboard UI, data APIs, and documentation.

## Current Behavior

The project can read sensor data, display it on a web dashboard, automatically
turn on the simulated AC LED at 28 C, and still allow manual dashboard
override.
