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

## QISU QSDCB4010S3.3 Fan Module

The QSDCB4010S3.3 is a 3.3 V fan connected through a small driver board. The
three pins on the driver board are labeled `VCC`, `GND`, and `GPIO`.

| Fan module pin | Connection |
|---|---|
| VCC | External regulated 3.3 V supply |
| GND | External supply GND and ESP32 GND |
| GPIO | ESP32 GPIO 27 control signal |

The external supply GND and ESP32 GND must be connected together. Do not
connect this 3.3 V fan to 5 V, GPIO 27, or the ESP32 `3V3` power pin. GPIO 27
is a control signal only. The driver board switches the fan power. Using the
ESP32 `3V3` pin for fan power can make the ESP32 power rail and WiFi unstable.

This LED represents the simulated AC state only. It is safe low-voltage status
output for the dashboard demo, not real air-conditioner or mains-power
control.
