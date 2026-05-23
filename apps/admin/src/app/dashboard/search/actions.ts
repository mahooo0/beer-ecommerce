'use server';

import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Helper to get auth token and make authenticated API requests
 */
async function authenticatedFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error('Unauthorized');
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Get all search settings
 */
export async function getSearchSettings() {
  const response = await authenticatedFetch<{
    data: {
      synonyms: Record<string, string[]>;
      stopWords: string[];
      rankingRules: string[];
    };
  }>('/search/settings');
  return response.data;
}

/**
 * Get current synonyms mapping
 */
export async function getSynonyms() {
  const response = await authenticatedFetch<{
    data: Record<string, string[]>;
  }>('/search/synonyms');
  return response.data;
}

/**
 * Update synonyms mapping
 */
export async function updateSynonyms(synonyms: Record<string, string[]>) {
  const response = await authenticatedFetch<{
    success: boolean;
    message: string;
  }>('/search/synonyms', {
    method: 'PUT',
    body: JSON.stringify({ synonyms }),
  });
  return response;
}

/**
 * Get current stop words list
 */
export async function getStopWords() {
  const response = await authenticatedFetch<{
    data: string[];
  }>('/search/stop-words');
  return response.data;
}

/**
 * Update stop words list
 */
export async function updateStopWords(stopWords: string[]) {
  const response = await authenticatedFetch<{
    success: boolean;
    message: string;
  }>('/search/stop-words', {
    method: 'PUT',
    body: JSON.stringify({ stopWords }),
  });
  return response;
}

/**
 * Get current ranking rules
 */
export async function getRankingRules() {
  const response = await authenticatedFetch<{
    data: string[];
  }>('/search/ranking-rules');
  return response.data;
}

/**
 * Update ranking rules
 */
export async function updateRankingRules(rankingRules: string[]) {
  const response = await authenticatedFetch<{
    success: boolean;
    message: string;
  }>('/search/ranking-rules', {
    method: 'PUT',
    body: JSON.stringify({ rankingRules }),
  });
  return response;
}

/**
 * Trigger a full product re-sync to Meilisearch
 */
export async function triggerFullSync() {
  const response = await authenticatedFetch<{
    success: boolean;
    message: string;
  }>('/search/sync', {
    method: 'POST',
  });
  return response;
}
