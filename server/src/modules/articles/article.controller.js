const articleService = require('./article.service');
const auditService = require('../audit/audit.service');
const ApiError = require('../../utils/errors');

class ArticleController {
  async list(req, res, next) {
    try {
      const result = await articleService.listArticles(req.tenant.id, req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const article = await articleService.getArticleById(req.tenant.id, req.params.articleId);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      // RBAC: Editors cannot create pre-published or archived articles
      if (req.membership.role === 'EDITOR' && req.body.status && req.body.status !== 'DRAFT') {
        throw ApiError.forbidden('Editors can only create draft articles', 'ROLE_NOT_AUTHORIZED');
      }

      const article = await articleService.createArticle(
        req.tenant.id,
        req.user.id,
        req.body
      );
      res.status(201).json({ article });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      // RBAC: Editors cannot publish or archive articles via update
      if (req.membership.role === 'EDITOR' && req.body.status && req.body.status !== 'DRAFT') {
        throw ApiError.forbidden(
          'Editors cannot change article status to PUBLISHED or ARCHIVED',
          'ROLE_NOT_AUTHORIZED'
        );
      }

      const article = await articleService.updateArticle(
        req.tenant.id,
        req.params.articleId,
        req.body
      );
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  }

  async publish(req, res, next) {
    try {
      const article = await articleService.publishArticle(req.tenant.id, req.params.articleId);

      // Record audit event
      await auditService.log(
        req.tenant.id,
        req.user.id,
        'ARTICLE_PUBLISHED',
        'ARTICLE',
        article.id,
        { title: article.title, slug: article.slug }
      );

      res.status(200).json({
        message: 'Article published successfully',
        article,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const permanent = req.query.permanent === 'true';
      const result = await articleService.deleteArticle(
        req.tenant.id,
        req.params.articleId,
        permanent
      );

      // Record audit event
      await auditService.log(
        req.tenant.id,
        req.user.id,
        permanent ? 'ARTICLE_DELETED' : 'ARTICLE_ARCHIVED',
        'ARTICLE',
        req.params.articleId,
        { permanent }
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ArticleController();
