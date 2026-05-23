import { MeiliSearch } from 'meilisearch';
import { config } from '../../config/index.js';
import type { SearchDocument } from './types.js';

export class SearchService {
  private client: MeiliSearch;
  private index;

  constructor() {
    this.client = new MeiliSearch({
      host: config.meilisearchHost,
      apiKey: config.meilisearchMasterKey,
    });
    this.index = this.client.index('products');
  }

  async initializeIndex(): Promise<void> {
    // Configure index settings
    await this.index.updateSettings({
      searchableAttributes: ['name', 'brandName', 'categoryName', 'description', 'sku'],
      filterableAttributes: ['categoryId', 'brandId', 'status', 'price', 'productType', 'categoryPath'],
      sortableAttributes: ['price', 'createdAt', 'updatedAt', 'name'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      faceting: {
        maxValuesPerFacet: 100,
        sortFacetValuesBy: { '*': 'count' },
      },
      pagination: {
        maxTotalHits: 1000,
      },
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 5,
          twoTypos: 9,
        },
      },
    });
  }

  async search(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      filter?: string | string[];
      facets?: string[];
      sort?: string[];
    }
  ) {
    return this.index.search(query, {
      ...options,
      attributesToHighlight: ['name', 'description'],
    });
  }

  async addDocuments(documents: SearchDocument[]) {
    return this.index.addDocuments(documents);
  }

  async deleteDocument(id: string) {
    return this.index.deleteDocument(id);
  }

  async deleteAllDocuments() {
    return this.index.deleteAllDocuments();
  }

  async updateSynonyms(synonyms: Record<string, string[]>) {
    return this.index.updateSynonyms(synonyms);
  }

  async getSynonyms() {
    return this.index.getSynonyms();
  }

  async updateStopWords(stopWords: string[]) {
    return this.index.updateStopWords(stopWords);
  }

  async getStopWords() {
    return this.index.getStopWords();
  }

  async updateRankingRules(rules: string[]) {
    return this.index.updateRankingRules(rules);
  }

  async getRankingRules() {
    return this.index.getRankingRules();
  }

  async getSettings() {
    return this.index.getSettings();
  }
}

export const searchService = new SearchService();
