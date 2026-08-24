import { useEffect, useState } from 'react';

import {
  getLatestPrediction,
  getLatestSensorReading,
  getSensorHistory,
  getSystemStatus,
} from '../services/api';
import type { DashboardData } from '../types/dashboard';

const INITIAL_STATE: DashboardData = {
  sensor: null,
  prediction: null,
  system: null,
  isLoading: true,
  error: null,
  lastUpdated: null,
  history: [],
};

export function useDashboardData(pollIntervalMs = 2000): DashboardData {
  const [state, setState] = useState<DashboardData>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const [sensor, prediction, system, history] = await Promise.all([
          getLatestSensorReading(),
          getLatestPrediction(),
          getSystemStatus(),
          getSensorHistory(100),
        ]);

        if (cancelled) return;

        setState({
          sensor,
          prediction,
          system,
          isLoading: false,
          error: null,
          lastUpdated: new Date().toISOString(),
          history: history && history.length > 0 ? history : sensor ? [sensor] : [],
        });
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastUpdated: new Date().toISOString(),
        }));
      }
    };

    void load();
    timer = window.setInterval(load, pollIntervalMs);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [pollIntervalMs]);

  return state;
}