# ESP32 Environment Monitor

This is an ESP32-based smart room monitoring project. It reads room
temperature, humidity, light level, and motion, then hosts a small local web
dashboard on the ESP32 so the values can be viewed from a browser.

The project also includes a beginner-friendly simulated air-conditioner
control feature. For now, the AC is represented by an LED and can be turned on
or off manually from the dashboard. It does not control a real air-conditioner
or any high-voltage hardware.

## Features

- Temperature and humidity monitoring using AM2302 / DHT22
- Occupancy detection using AM312 PIR sensor
- Light intensity monitoring using BH1750
- Web dashboard hosted on ESP32
- JavaScript live data update
- Manual simulated AC ON/OFF control using an LED

## Project Architecture

The Arduino sketch is organized around a few small functions:

- `readSensors()` reads the DHT22, BH1750, and PIR sensor inputs.
- `updateOccupancy()` updates the room occupancy state using the PIR sensor
  and a short hold time after the last motion event.
- `updateAcState()` writes the current simulated AC state to the LED output.
- `buildJsonResponse()` builds the JSON payload returned by the `/data`
  endpoint for the web dashboard.

The ESP32 web server exposes two routes:

- `/` serves the dashboard HTML, CSS, and JavaScript.
- `/data` returns the latest sensor values and state as JSON.
- `/ac/on` turns the simulated AC LED on.
- `/ac/off` turns the simulated AC LED off.

The dashboard fetches `/data` every two seconds and updates the page without a
refresh. The AC buttons call `/ac/on` and `/ac/off`, then refresh the displayed
state.

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

The sketch uses standard ESP32 Arduino libraries for WiFi, I2C, and the web
server. No complex additional dependencies are required.

## WiFi Configuration

The WiFi network name and password are defined near the top of the Arduino
sketch:

```cpp
const char* ssid = "31-2";
const char* password = "Hello202101";
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

## Current Limitations

- The AC feature is only simulated with an LED.
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
- Add automatic simulated AC recommendations or control, such as:
  - turn or recommend AC on when temperature is high and occupancy is true
  - turn or recommend AC off when the room is empty for a while
- Add clearer visual status indicators, possibly traffic-light style LEDs.
- Consider logging readings to a server or database in a later full-stack
  version.
- Build a stronger IoT portfolio project around hardware, embedded firmware,
  dashboard UI, data APIs, and documentation.

## Current Behavior

The project can read sensor data, display it on a web dashboard, and manually
control a simulated AC LED from the dashboard.
