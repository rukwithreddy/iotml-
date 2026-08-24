import type { PredictionSnapshot, SensorReading, SystemStatus } from '../types/dashboard';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8001';

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getLatestSensorReading(): Promise<SensorReading | null> {
  const data = await requestJson<SensorReading | { status: string }>('/api/sensors/latest');
  if ('status' in data) {
    return null;
  }
  return data;
}

export async function getLatestPrediction(): Promise<PredictionSnapshot> {
  return requestJson<PredictionSnapshot>('/api/predictions/latest');
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return requestJson<SystemStatus>('/api/system/status');
}

export async function getSensorHistory(limit = 100): Promise<SensorReading[]> {
  try {
    const data = await requestJson<{ count: number; readings: SensorReading[] }>(`/api/sensors/history?limit=${limit}`);
    return data.readings || [];
  } catch {
    return [];
  }
}