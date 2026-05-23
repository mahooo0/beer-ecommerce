import { Router } from 'express';
import { searchController } from './search.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', (req, res, next) => searchController.search(req, res, next));

// Admin routes
router.get('/settings', requireAdmin, (req, res, next) => searchController.getSettings(req, res, next));
router.get('/synonyms', requireAdmin, (req, res, next) => searchController.getSynonyms(req, res, next));
router.put('/synonyms', requireAdmin, (req, res, next) => searchController.updateSynonyms(req, res, next));
router.get('/stop-words', requireAdmin, (req, res, next) => searchController.getStopWords(req, res, next));
router.put('/stop-words', requireAdmin, (req, res, next) => searchController.updateStopWords(req, res, next));
router.get('/ranking-rules', requireAdmin, (req, res, next) => searchController.getRankingRules(req, res, next));
router.put('/ranking-rules', requireAdmin, (req, res, next) => searchController.updateRankingRules(req, res, next));
router.post('/sync', requireAdmin, (req, res, next) => searchController.triggerFullSync(req, res, next));

export { router as searchRoutes };
