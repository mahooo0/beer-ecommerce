import type { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service.js';
import { syncService } from './sync.service.js';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const filter = req.query.filter as string | undefined;
      const sort = req.query.sort as string | undefined;

      if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
      }

      const results = await searchService.search(q, {
        limit,
        offset,
        filter: filter ? [filter] : undefined,
        facets: ['brandName', 'categoryName', 'productType'],
        sort: sort ? [sort] : undefined,
      });

      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  async getSynonyms(req: Request, res: Response, next: NextFunction) {
    try {
      const synonyms = await searchService.getSynonyms();
      res.json(synonyms);
    } catch (error) {
      next(error);
    }
  }

  async updateSynonyms(req: Request, res: Response, next: NextFunction) {
    try {
      const synonyms = req.body.synonyms as Record<string, string[]>;
      await searchService.updateSynonyms(synonyms);
      res.json({ success: true, message: 'Synonyms updated' });
    } catch (error) {
      next(error);
    }
  }

  async getStopWords(req: Request, res: Response, next: NextFunction) {
    try {
      const stopWords = await searchService.getStopWords();
      res.json(stopWords);
    } catch (error) {
      next(error);
    }
  }

  async updateStopWords(req: Request, res: Response, next: NextFunction) {
    try {
      const stopWords = req.body.stopWords as string[];
      await searchService.updateStopWords(stopWords);
      res.json({ success: true, message: 'Stop words updated' });
    } catch (error) {
      next(error);
    }
  }

  async getRankingRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await searchService.getRankingRules();
      res.json(rules);
    } catch (error) {
      next(error);
    }
  }

  async updateRankingRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rankingRules = req.body.rankingRules as string[];
      await searchService.updateRankingRules(rankingRules);
      res.json({ success: true, message: 'Ranking rules updated' });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await searchService.getSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  async triggerFullSync(req: Request, res: Response, next: NextFunction) {
    try {
      // Fire and forget - don't wait for sync to complete
      syncService.fullSync().catch((err) => {
        console.error('Full sync failed:', err);
      });
      res.json({ success: true, message: 'Full sync started' });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
