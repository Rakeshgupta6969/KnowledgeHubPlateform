const publicService = require('./public.service');

class PublicController {
  async getTenantConfig(req, res, next) {
    try {
      const tenant = await publicService.getPublicTenant(req.params.tenantSlug);
      res.status(200).json({ tenant });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const result = await publicService.getPublicCategories(req.params.tenantSlug);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getArticles(req, res, next) {
    try {
      const result = await publicService.getPublicArticles(req.params.tenantSlug, req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getArticleBySlug(req, res, next) {
    try {
      const result = await publicService.getPublicArticleBySlug(
        req.params.tenantSlug,
        req.params.articleSlug
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async searchArticles(req, res, next) {
    try {
      const result = await publicService.searchPublicArticles(
        req.params.tenantSlug,
        req.query
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async submitFeedback(req, res, next) {
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const result = await publicService.submitArticleFeedback(
        req.params.tenantSlug,
        req.params.articleSlug,
        req.body,
        clientIp
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async recordView(req, res, next) {
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      const result = await publicService.recordArticleView(
        req.params.tenantSlug,
        req.params.articleSlug,
        userAgent,
        clientIp
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PublicController();
