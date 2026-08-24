# Bridge Model Mapping

The trained artifact expects these features:

- `Displacement_mm`
- `Temperature_C`
- `Vibration_ms2`
- `Soil_Settlement_mm`

What is currently justified from the live Arduino stream:

- `Displacement_mm` can be derived from the ultrasonic `Dist(cm)` column using the exact unit conversion `1 cm = 10 mm`.
- `Temperature_C` can be used directly when the Arduino reports a numeric temperature.

What is not yet justified from the live Arduino stream:

- `Vibration_ms2`
- `Soil_Settlement_mm`

The current prediction service refuses to invent those values. It will raise a clear error until the calibration or training mapping is known.