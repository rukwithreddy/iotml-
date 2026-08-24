# Phase 0 Notes

## Verified from the workspace

### Hardware and sensor log

The file `SHM Hackathon.txt` contains a 1-minute sensor log with these columns:

- `Sec`
- `Dist(cm)`
- `Temp(C)`
- `Sound`
- `Soil_Raw`
- `Soil(%)`
- `Vib_Raw`
- `Vib(%)`

The log indicates these sensors are present:

- Ultrasonic distance sensor
- DHT22 temperature sensor
- Sound sensor
- Soil moisture sensor
- Piezo vibration sensor

### Live Arduino serial

The Arduino stream is readable in this session at `9600` baud.

Observed row format:

- `Sec | Dist(cm) | Temp(C) | Sound | Soil_Raw | Soil(%) | Vib_Raw | Vib(%)`

Clean sample rows captured live:

- `1 | 0.1 | Error | 448 | 256 | 74% | 50 | 4%`
- `2 | 0.1 | Error | 498 | 255 | 75% | 441 | 43%`
- `3 | 0.1 | Error | 1023 | 255 | 75% | 753 | 73%`

### Model artifact

The file `bridge_anomaly_model.pkl` is a scikit-learn pipeline.

Detected components inside the pickle:

- `SimpleImputer(strategy='median')`
- `StandardScaler`
- `RandomForestClassifier`

Embedded feature names:

- `Displacement_mm`
- `Temperature_C`
- `Vibration_ms2`
- `Soil_Settlement_mm`

### Environment

- Operating system: Pop!_OS
- User-reported Python: 3.12
- Workspace system Python: 3.13.14
- Arduino board: Arduino Uno

## Unknowns that still block implementation

- Exact Arduino sketch
- Pin mapping for each sensor
- Serial message format
- Prediction target meaning
- Label names or class mapping from the model
- Source dataset and training procedure

## Remaining unknowns

- Exact Arduino sketch
- Pin mapping for each sensor
- Prediction target meaning
- Label names or class mapping from the model
- Source dataset and training procedure

## Implication

The live inference layer cannot be written safely until the raw sensor values are mapped to the model's expected features.

Until serial access is available, the next valid implementation step is to confirm the port permissions and capture a few real lines from the Arduino.

## Added progress

- Live Arduino data is now readable at 9600 baud.
- The Python serial reader parses the real row format.
- Raw readings can be appended to `data/raw/sensor_readings.csv`.
- The model artifact loads with scikit-learn 1.6.1 and exposes classes `High`, `Low`, and `Medium`.
- A backend status endpoint now reports that only displacement and temperature are directly mapped from the live stream.
- Prediction remains blocked until vibration and soil-settlement calibration are defined.
