# Wiring

## AM2302 / DHT22 Temperature and Humidity Sensor

| Sensor Pin | ESP32 Pin |
|---|---|
| VCC | 3.3V |
| GND | GND |
| DATA | GPIO 4 |

## AM312 PIR Motion Sensor

| Sensor Pin | ESP32 Pin |
|---|---|
| VCC | 3.3V |
| GND | GND |
| OUT | GPIO 18 |

## BH1750 Light Sensor

| Sensor Pin | ESP32 Pin |
|---|---|
| VCC | 3.3V |
| GND | GND |
| SDA | GPIO 21 |
| SCL | GPIO 22 |
| ADDR | Not connected |

## Simulated AC LED

| Component | ESP32 Pin |
|---|---|
| LED positive side | GPIO 26 through resistor |
| LED negative side | GND |

## Low-Voltage Fan Control

| Component | ESP32 Pin |
|---|---|
| Fan control signal | GPIO 27 |
| Fan power | External 5V supply or suitable driver board |
| Fan ground | Common ground with ESP32 |

Do not power a fan directly from an ESP32 GPIO pin. Use a small transistor,
MOSFET driver, or motor driver module that matches the fan you bought.

This LED represents the simulated AC state only. It is safe low-voltage status
output for the dashboard demo, not real air-conditioner or mains-power
control.
