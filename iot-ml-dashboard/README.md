# IoT ML Dashboard

Real-time IoT sensor monitoring and ML dashboard built around the actual Arduino hardware and model artifact in this workspace.

## Verified facts so far

- Arduino board: Arduino Uno
- Laptop OS: Pop!_OS
- Python version: 3.12 reported by user; system Python available in workspace is 3.13.14
- Verified Arduino serial baud rate: 9600
- Sensors visible in the log file:
  - Ultrasonic distance sensor
  - DHT22 temperature sensor
  - Sound sensor
  - Soil moisture sensor
  - Piezo vibration sensor
- Model artifact: `bridge_anomaly_model.pkl`
- Model stack inside the pickle: `sklearn.pipeline.Pipeline`, `SimpleImputer`, `StandardScaler`, `RandomForestClassifier`
- Model classes inside the pickle: `High`, `Low`, `Medium`
- Feature names embedded in the model artifact:
  - `Displacement_mm`
  - `Temperature_C`
  - `Vibration_ms2`
  - `Soil_Settlement_mm`

## Model compatibility note

The artifact was trained with scikit-learn `1.6.1`. The backend requirements now pin that version to keep model loading consistent.

## Important mismatch to resolve

The sensor log shows distance, temperature, sound, soil moisture, and vibration. The trained model expects displacement, temperature, vibration acceleration, and soil settlement. We need the exact mapping before live inference code can be written safely.

## Current blocker list

- Exact Arduino sketch
- Exact baud rate
- Exact pin wiring for each sensor
- Exact serial output format
- Exact prediction label meaning
- Whether the model artifact is the final production model
- Whether there is a separate dataset used to train it

## Live serial sample

The Arduino is currently readable at 9600 baud. The sketch prints a banner followed by rows in this shape:

`Sec | Dist(cm) | Temp(C) | Sound | Soil_Raw | Soil(%) | Vib_Raw | Vib(%)`

Sample rows captured from the live stream:

`1 | 0.1 | Error | 448 | 256 | 74% | 50 | 4%`
`2 | 0.1 | Error | 498 | 255 | 75% | 441 | 43%`
`3 | 0.1 | Error | 1023 | 255 | 75% | 753 | 73%`

## Next phase

Phase 0 is not complete until the missing hardware and ML requirements are confirmed.

## Phase 1 progress

The first live Python reader now exists at `backend/scripts/read_sensor_data.py`. It reads the Arduino at 9600 baud, parses rows in the captured format, and prints JSON objects for valid rows.

## Phase 2 progress

Raw data collection now exists at `backend/scripts/collect_raw_sensor_data.py`. It appends validated readings to `data/raw/sensor_readings.csv` instead of overwriting prior sensor history.

Validation result:

- Two live rows were saved successfully from the Arduino stream.
- Invalid banner/header lines were rejected and logged instead of being silently dropped.

## Phase 3 progress

The bridge model loader and feature mapper now exist under `backend/app/ml/`. The live Arduino stream can be converted to the two directly justified inputs, but the model still cannot predict safely until the vibration and soil-settlement calibration is defined.

The backend now exposes `GET /api/system/status` and reports:

- the model is loaded
- the model classes are `High`, `Low`, and `Medium`
- only `displacement_mm` and `temperature_c` are directly mapped from the live sensors today
- `vibration_ms2` and `soil_settlement_mm` are still unresolved
- prediction readiness is currently `false`

The backend also exposes `GET /api/sensors/latest`, `GET /api/sensors/history`, and `GET /api/predictions/latest`. The prediction endpoint currently returns `unavailable` until the remaining feature calibration is known.

Run the backend on port `8001` and the frontend on port `5174` so they do not conflict with the stale `8000` process.

## Phase 4 progress

The React dashboard is now scaffolded in `frontend/`, polls the backend APIs, and shows the current anomaly result card along with the live sensor cards.

Current dashboard behavior:

- live readings are fetched every 2 seconds
- the latest prediction status is displayed in the anomaly result panel
- when the model is not ready, the dashboard shows the backend reason instead of inventing a prediction
- the frontend build passes with Vite and TypeScript
