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
- Provide beginner-friendly manual simulated AC ON/OFF control from the
  dashboard.
- Later, grow the project toward a more complete IoT / full-stack style
  portfolio project.

## Hardware

The project currently targets:

- ESP32 DevKit board.
- AM2302 / DHT22 temperature and humidity sensor.
- BH1750 light sensor via I2C.
- AM312 PIR motion sensor.
- LEDs for status indicators or traffic-light style control when needed.

Keep existing hardware pin assignments unless the user explicitly asks to
change them.

The simulated AC feature must remain low-voltage and LED-based unless the user
explicitly asks for something else. Do not add real high-voltage AC control,
relay wiring, or dangerous hardware instructions.

## Important Rules

- Do not change WiFi SSID or password logic unless explicitly asked.
- Do not change existing hardware pin assignments unless explicitly asked.
- Keep the existing `/` and `/data` routes working.
- Keep JSON field names stable unless explicitly asked to change them.
- Manual AC control routes such as `/ac/on` and `/ac/off` are acceptable when
  they stay simple and beginner-readable.
- Prefer small, beginner-readable changes.
- Explain changes clearly in `README.md` when project structure changes.
- Avoid adding heavy dependencies.
- Keep the project compatible with Arduino IDE.

## Code Style

- Favor clear Arduino functions over large blocks of logic in route handlers.
- Keep sensor reading, occupancy logic, AC/status logic, and JSON building
  separated when practical.
- For the first simulated AC version, store AC state in a simple boolean such
  as `acOn` and expose it through `/data`.
- Use simple names and straightforward control flow so the code remains
  approachable for a beginner.
- Add comments only where they clarify non-obvious behavior.

## Feature Direction

Current simulated AC work should stay manual:

- The dashboard should show the current AC state.
- The dashboard may provide clear ON and OFF buttons.
- The ESP32 should store the simulated AC state in memory.
- The `/data` endpoint should include the AC state using the existing `acOn`
  field.

Later work may add automatic control or recommendations based on temperature,
occupancy, and light level. Keep that future logic separate from the first
manual control version so the code remains easy to understand.

## Testing

- Codex may not always be able to compile Arduino code in its environment.
- If compilation cannot be verified, say so clearly.
- Keep changes easy to verify manually in Arduino IDE.
- When possible, verify that:
  - The sketch still compiles for an ESP32 board.
  - The ESP32 still connects to WiFi using the existing behavior.
  - The dashboard route `/` still loads.
  - The JSON route `/data` still returns the expected field names.
