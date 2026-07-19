# AGENTS.md

## Project Overview

This repository is an ESP32 Arduino project for a dorm or room environment
monitoring dashboard.

The current project goals are:

- Read temperature and humidity from an AM2302 / DHT22 sensor.
- Read light intensity from a BH1750 light sensor over I2C.
- Detect motion and occupancy using an AM312 PIR sensor.
- Serve a local web dashboard from the ESP32.
- Provide a `/data` endpoint that returns JSON for JavaScript polling.
- Provide beginner-friendly simulated AC control with an automatic 28 C rule
  and manual dashboard override.
- Provide a small backend path toward full-stack development, including a
  Node.js API and SQLite history storage.
- Later, grow the project toward a more complete IoT / full-stack style
  portfolio project.

## Hardware

The project currently targets:

- ESP32 DevKit board.
- AM2302 / DHT22 temperature and humidity sensor.
- BH1750 light sensor via I2C.
- AM312 PIR motion sensor.
- LEDs for status indicators or traffic-light style control when needed.
- Low-voltage fan controlled through a suitable driver, not directly by GPIO.

Keep existing hardware pin assignments unless the user explicitly asks to
change them.

The simulated AC feature must remain low-voltage and LED-based unless the user
explicitly asks for something else. Do not add real high-voltage AC control,
relay wiring, or dangerous hardware instructions.
- Do not instruct the user to power a fan directly from an ESP32 GPIO pin.
  Use a transistor, MOSFET driver, or motor driver for real fan hardware.

## Important Rules

- Do not change WiFi SSID or password logic unless explicitly asked.
- Do not change existing hardware pin assignments unless explicitly asked.
- Keep the existing `/` and `/data` routes working.
- Keep JSON field names stable unless explicitly asked to change them.
- Manual AC control routes such as `/ac/on`, `/ac/off`, and `/ac/auto` are
  acceptable when they stay simple and beginner-readable.
- Prefer small, beginner-readable changes.
- Explain changes clearly in `README.md` when project structure changes.
- Avoid adding heavy dependencies.
- Keep the project compatible with Arduino IDE.
- Keep backend additions small and beginner-readable. The backend may use
  Express and SQLite, but avoid large frameworks until the project needs them.

## Code Style

- Favor clear Arduino functions over large blocks of logic in route handlers.
- Keep sensor reading, occupancy logic, AC/status logic, and JSON building
  separated when practical.
- Store AC state in simple variables such as `acOn` and `acManualOverride`,
  and expose the current AC state through `/data`.
- Use simple names and straightforward control flow so the code remains
  approachable for a beginner.
- Add comments only where they clarify non-obvious behavior.

## Feature Direction

Current simulated AC work should stay beginner-readable:

- The dashboard should show the current AC state.
- The dashboard may provide clear ON, OFF, and Auto buttons.
- The ESP32 should store the simulated AC state in memory.
- The `/data` endpoint should include the AC state using the existing `acOn`
  field.
- Automatic control should turn on the simulated AC only when the room is
  occupied and temperature reaches 28 C, unless manual override is active.

Later work may improve automatic control or recommendations based on
temperature, occupancy, and light level. Keep future logic separated so the
code remains easy to understand.

## Backend Direction

The `backend/` folder is for the full-stack roadmap:

- Accept readings from the ESP32 or manual test clients.
- Save readings to a local SQLite database.
- Expose simple JSON routes for latest and historical readings.
- Show recent readings and simple temperature/humidity trend charts without
  adding heavy frontend dependencies.
- Keep local database files out of Git.
- ESP32 backend posting should stay optional and beginner-readable. Keep it
  disabled by default with a boolean such as `backendPostingEnabled`, and use
  placeholders for local IP addresses in committed code.

## Testing

- Codex may not always be able to compile Arduino code in its environment.
- If compilation cannot be verified, say so clearly.
- Keep changes easy to verify manually in Arduino IDE.
- When possible, verify that:
  - The sketch still compiles for an ESP32 board.
  - The ESP32 still connects to WiFi using the existing behavior.
  - The dashboard route `/` still loads.
  - The JSON route `/data` still returns the expected field names.
