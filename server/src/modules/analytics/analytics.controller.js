const analyticsService = require('./analytics.service');

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const result = await analyticsService.getOverview(req.tenant.id, req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTopArticles(req, res, next) {
    try {
      const result = await analyticsService.getTopArticles(req.tenant.id, req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getSearches(req, res, next) {
    try {
      const result = await analyticsService.getSearches(req.tenant.id, req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
