import { getSynonyms, getStopWords, getRankingRules } from './actions';
import { SearchSettingsForm } from './search-settings-form';

export default async function SearchSettingsPage() {
  // Fetch all search settings in parallel
  const [synonyms, stopWords, rankingRules] = await Promise.all([
    getSynonyms(),
    getStopWords(),
    getRankingRules(),
  ]);

  return (
    <div className="space-y-6">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Search Settings</h1>
          <p className="text-muted-foreground">
            Configure Meilisearch behavior for product search. Manage synonyms, stop words,
            ranking rules, and trigger full product re-indexing.
          </p>
        </div>

        <SearchSettingsForm
          initialSynonyms={synonyms}
          initialStopWords={stopWords}
          initialRankingRules={rankingRules}
        />
      </div>
    </div>
  );
}
