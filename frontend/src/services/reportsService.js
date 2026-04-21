import api from './api';

export async function fetchReportSummary(period, ref) {
  const { data } = await api.get('/api/v1/reports/summary', { params: { period, ref } });
  return data;
}
