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

## Important Rules

- Do not change WiFi SSID or password logic unless explicitly asked.
- Do not change existing hardware pin assignments unless explicitly asked.
- Keep the existing `/` and `/data` routes working.
- Keep JSON field names stable unless explicitly asked to change them.
- Prefer small, beginner-readable changes.
- Explain changes clearly in `README.md` when project structure changes.
- Avoid adding heavy dependencies.
- Keep the project compatible with Arduino IDE.

## Code Style

- Favor clear Arduino functions over large blocks of logic in route handlers.
- Keep sensor reading, occupancy logic, AC/status logic, and JSON building
  separated when practical.
- Use simple names and straightforward control flow so the code remains
  approachable for a beginner.
- Add comments only where they clarify non-obvious behavior.

## Testing

- Codex may not always be able to compile Arduino code in its environment.
- If compilation cannot be verified, say so clearly.
- Keep changes easy to verify manually in Arduino IDE.
- When possible, verify that:
  - The sketch still compiles for an ESP32 board.
  - The ESP32 still connects to WiFi using the existing behavior.
  - The dashboard route `/` still loads.
  - The JSON route `/data` still returns the expected field names.
