/**
 * VeloHub V3 - Sociais API Service
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Serviço de API para o módulo Sociais (tabulação, dashboard, feed, relatórios).
 * Usa API_BASE_URL + /sociais e envia x-session-id para middleware de acesso.
 */

import axios from 'axios';
import { getApiBaseUrl } from '../config/api-config';

const SOCIAIS_BASE_URL = `${getApiBaseUrl()}/sociais`;

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const sessionId = localStorage.getItem('velohub_session_id');
  if (sessionId) headers['x-session-id'] = sessionId;
  return headers;
}

const api = axios.create({
  baseURL: SOCIAIS_BASE_URL,
  headers: getHeaders()
});

api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('velohub_session_id');
  if (sessionId) config.headers['x-session-id'] = sessionId;
  return config;
});

export const createTabulation = async (data) => {
  const response = await api.post('/tabulation', data);
  return response.data;
};

export const getTabulations = async (filters = {}) => {
  const params = {};
  if (filters.socialNetwork) params.socialNetwork = filters.socialNetwork;
  if (filters.contactReason) params.contactReason = filters.contactReason;
  if (filters.sentiment) params.sentiment = filters.sentiment;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  const response = await api.get('/tabulations', { params });
  return response.data;
};

export const getDashboardMetrics = async (filters = {}) => {
  const params = {};
  if (filters.socialNetwork) params.socialNetwork = filters.socialNetwork;
  if (filters.contactReason) params.contactReason = filters.contactReason;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  const response = await api.get('/dashboard/metrics', { params });
  return response.data;
};

export const getChartData = async (filters = {}) => {
  const params = {};
  if (filters.socialNetwork) params.socialNetwork = filters.socialNetwork;
  if (filters.contactReason) params.contactReason = filters.contactReason;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  const response = await api.get('/dashboard/charts', { params });
  return response.data;
};

export const getRatingAverage = async (filters = {}) => {
  const params = {};
  if (filters.socialNetwork) params.socialNetwork = filters.socialNetwork;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  const response = await api.get('/rating/average', { params });
  return response.data;
};

export const getFeed = async (filters = {}) => {
  const params = {};
  if (filters.socialNetwork) params.socialNetwork = filters.socialNetwork;
  if (filters.contactReason) params.contactReason = filters.contactReason;
  if (filters.sentiment) params.sentiment = filters.sentiment;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  const response = await api.get('/feed', { params });
  return response.data;
};

export const analyzeText = async (text) => {
  const response = await api.post('/analyze', { text });
  return response.data;
};

export const generateReport = async (data, filters = null) => {
  const payload = filters ? { filters } : { data };
  const response = await api.post('/report', payload);
  return response.data;
};

export const getTabulationById = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const updateTabulation = async (id, data) => {
  const response = await api.put(`/${id}`, data);
  return response.data;
};

export const deleteTabulation = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export default api;
