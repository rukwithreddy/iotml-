export type SeverityLevel = 'Low' | 'Medium' | 'High';

export type SensorReading = {
  captured_at: string;
  sec: number;
  distance_cm: number;
  temperature_c: number | null;
  humidity: number | null;
  sound_raw: number;
  soil_raw: number;
  soil_percent: number;
  vibration_raw: number;
  vibration_percent: number;
  raw_line: string;
};

export type SeverityDetail = {
  distance: SeverityLevel | null;
  temperature: SeverityLevel | null;
  sound: SeverityLevel;
  moisture: SeverityLevel;
  vibration: SeverityLevel;
  overall: SeverityLevel;
};

export type FinalSeverityDetail = {
  distance: SeverityLevel;
  temperature: SeverityLevel;
  sound: SeverityLevel;
  moisture: SeverityLevel;
  vibration: SeverityLevel;
  overall: SeverityLevel;
};

export type MappedFeatures = {
  displacement_mm: number | null;
  temperature_c: number | null;
  vibration_ms2: number | null;
  soil_settlement_mm: number | null;
};

export type PredictionSnapshot = {
  status: 'ok' | 'unavailable';
  prediction?: SeverityLevel | null;
  confidence?: number | null;
  mapping_notes: string[];
  reason?: string | null;
  severity?: SeverityDetail | null;
  final_severity?: FinalSeverityDetail | null;
  mapped_features?: MappedFeatures | null;
};

export type SystemStatus = {
  model_loaded: boolean;
  model_path: string;
  model_classes: string[];
  required_features: string[];
  directly_mappable_features: string[];
  unresolved_features: string[];
  ready_for_prediction: boolean;
  serial_connected?: boolean;
};

export type DashboardData = {
  sensor: SensorReading | null;
  prediction: PredictionSnapshot | null;
  system: SystemStatus | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  history: SensorReading[];
};

export type User = {
  username: string;
  name: string;
};

export type PageView = 'landing' | 'login' | 'dashboard';