'use client';

import { useState } from 'react';
import { updateSynonyms, updateStopWords, updateRankingRules, triggerFullSync } from './actions';

interface SearchSettingsFormProps {
  initialSynonyms: Record<string, string[]>;
  initialStopWords: string[];
  initialRankingRules: string[];
}

export function SearchSettingsForm({
  initialSynonyms,
  initialStopWords,
  initialRankingRules,
}: SearchSettingsFormProps) {
  // Synonyms state
  const [synonyms, setSynonyms] = useState<Record<string, string[]>>(initialSynonyms);
  const [newSynonymKey, setNewSynonymKey] = useState('');
  const [newSynonymValues, setNewSynonymValues] = useState('');
  const [synonymsStatus, setSynonymsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [synonymsLoading, setSynonymsLoading] = useState(false);

  // Stop words state
  const [stopWords, setStopWords] = useState<string[]>(initialStopWords);
  const [newStopWord, setNewStopWord] = useState('');
  const [stopWordsStatus, setStopWordsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stopWordsLoading, setStopWordsLoading] = useState(false);

  // Ranking rules state
  const [rankingRules, setRankingRules] = useState<string[]>(initialRankingRules);
  const [rankingRulesStatus, setRankingRulesStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rankingRulesLoading, setRankingRulesLoading] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const defaultRankingRules = ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'];

  // Synonym handlers
  const handleAddSynonym = () => {
    if (!newSynonymKey.trim() || !newSynonymValues.trim()) return;

    const values = newSynonymValues
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (values.length === 0) return;

    setSynonyms(prev => ({
      ...prev,
      [newSynonymKey.trim().toLowerCase()]: values,
    }));
    setNewSynonymKey('');
    setNewSynonymValues('');
  };

  const handleRemoveSynonym = (key: string) => {
    setSynonyms(prev => {
      const newSynonyms = { ...prev };
      delete newSynonyms[key];
      return newSynonyms;
    });
  };

  const handleSaveSynonyms = async () => {
    setSynonymsLoading(true);
    setSynonymsStatus(null);
    try {
      const result = await updateSynonyms(synonyms);
      setSynonymsStatus({ type: 'success', message: result.message || 'Synonyms saved successfully' });
    } catch (error) {
      setSynonymsStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save synonyms'
      });
    } finally {
      setSynonymsLoading(false);
    }
  };

  // Stop words handlers
  const handleAddStopWord = () => {
    const word = newStopWord.trim().toLowerCase();
    if (!word || stopWords.includes(word)) return;

    setStopWords(prev => [...prev, word]);
    setNewStopWord('');
  };

  const handleRemoveStopWord = (word: string) => {
    setStopWords(prev => prev.filter(w => w !== word));
  };

  const handleSaveStopWords = async () => {
    setStopWordsLoading(true);
    setStopWordsStatus(null);
    try {
      const result = await updateStopWords(stopWords);
      setStopWordsStatus({ type: 'success', message: result.message || 'Stop words saved successfully' });
    } catch (error) {
      setStopWordsStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save stop words'
      });
    } finally {
      setStopWordsLoading(false);
    }
  };

  // Ranking rules handlers
  const handleMoveRuleUp = (index: number) => {
    if (index === 0) return;
    setRankingRules(prev => {
      const newRules = [...prev];
      [newRules[index - 1], newRules[index]] = [newRules[index]!, newRules[index - 1]!];
      return newRules;
    });
  };

  const handleMoveRuleDown = (index: number) => {
    if (index === rankingRules.length - 1) return;
    setRankingRules(prev => {
      const newRules = [...prev];
      [newRules[index], newRules[index + 1]] = [newRules[index + 1]!, newRules[index]!];
      return newRules;
    });
  };

  const handleResetRankingRules = () => {
    setRankingRules(defaultRankingRules);
  };

  const handleSaveRankingRules = async () => {
    setRankingRulesLoading(true);
    setRankingRulesStatus(null);
    try {
      const result = await updateRankingRules(rankingRules);
      setRankingRulesStatus({ type: 'success', message: result.message || 'Ranking rules saved successfully' });
    } catch (error) {
      setRankingRulesStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save ranking rules'
      });
    } finally {
      setRankingRulesLoading(false);
    }
  };

  // Sync handler
  const handleTriggerSync = async () => {
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const result = await triggerFullSync();
      setSyncStatus({ type: 'success', message: result.message || 'Full sync started successfully' });
    } catch (error) {
      setSyncStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to trigger sync'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SYNONYMS SECTION */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Synonyms</h3>
          <p className="text-sm text-gray-600">
            Define synonym mappings to improve search results. When users search for the key word,
            results will also include synonyms.
          </p>
        </div>

        {/* Current synonyms list */}
        <div className="space-y-2">
          {Object.entries(synonyms).length > 0 ? (
            Object.entries(synonyms).map(([key, values]) => (
              <div key={key} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{key}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-gray-600">{values.join(', ')}</span>
                </div>
                <button
                  onClick={() => handleRemoveSynonym(key)}
                  className="text-red-600 hover:text-red-800 text-sm px-2"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No synonyms defined yet</p>
          )}
        </div>

        {/* Add synonym form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSynonymKey}
            onChange={(e) => setNewSynonymKey(e.target.value)}
            placeholder="Word"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newSynonymValues}
            onChange={(e) => setNewSynonymValues(e.target.value)}
            placeholder="Synonyms (comma-separated)"
            className="flex-[2] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddSynonym}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Add Synonym
          </button>
        </div>

        {/* Save button and status */}
        <div>
          <button
            onClick={handleSaveSynonyms}
            disabled={synonymsLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {synonymsLoading ? 'Saving...' : 'Save Synonyms'}
          </button>
          {synonymsStatus && (
            <p className={`mt-2 text-sm ${synonymsStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {synonymsStatus.message}
            </p>
          )}
        </div>
      </div>

      {/* STOP WORDS SECTION */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Stop Words</h3>
          <p className="text-sm text-gray-600">
            Words that will be ignored during search. Common words like 'the', 'a', 'and' are
            typically stop words.
          </p>
        </div>

        {/* Current stop words as pills */}
        <div className="flex flex-wrap gap-2">
          {stopWords.length > 0 ? (
            stopWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {word}
                <button
                  onClick={() => handleRemoveStopWord(word)}
                  className="text-gray-500 hover:text-red-600 ml-1"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No stop words defined yet</p>
          )}
        </div>

        {/* Add stop word form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newStopWord}
            onChange={(e) => setNewStopWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddStopWord()}
            placeholder="Enter a word"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddStopWord}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Add
          </button>
        </div>

        {/* Save button and status */}
        <div>
          <button
            onClick={handleSaveStopWords}
            disabled={stopWordsLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stopWordsLoading ? 'Saving...' : 'Save Stop Words'}
          </button>
          {stopWordsStatus && (
            <p className={`mt-2 text-sm ${stopWordsStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {stopWordsStatus.message}
            </p>
          )}
        </div>
      </div>

      {/* RANKING RULES SECTION */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Ranking Rules</h3>
          <p className="text-sm text-gray-600">
            Define the order of ranking criteria. Results are ranked by the first rule, then ties
            are broken by subsequent rules.
          </p>
        </div>

        {/* Ranking rules list with reorder controls */}
        <div className="space-y-2">
          {rankingRules.map((rule, index) => (
            <div key={rule} className="flex items-center gap-3 bg-gray-50 p-3 rounded">
              <span className="text-sm font-medium text-gray-500 w-8">{index + 1}.</span>
              <span className="flex-1 text-gray-900">{rule}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleMoveRuleUp(index)}
                  disabled={index === 0}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveRuleDown(index)}
                  disabled={index === rankingRules.length - 1}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveRankingRules}
            disabled={rankingRulesLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rankingRulesLoading ? 'Saving...' : 'Save Ranking Rules'}
          </button>
          <button
            onClick={handleResetRankingRules}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Reset to Default
          </button>
        </div>

        {rankingRulesStatus && (
          <p className={`text-sm ${rankingRulesStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {rankingRulesStatus.message}
          </p>
        )}
      </div>

      {/* SYNC SECTION */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Full Re-sync</h3>
          <p className="text-sm text-gray-600">
            Re-index all active products to Meilisearch. Use this after manual database changes or
            if search results seem out of sync.
          </p>
        </div>

        <div>
          <button
            onClick={handleTriggerSync}
            disabled={syncLoading}
            className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncLoading ? 'Syncing...' : 'Trigger Full Re-sync'}
          </button>
          {syncStatus && (
            <p className={`mt-2 text-sm ${syncStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {syncStatus.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
