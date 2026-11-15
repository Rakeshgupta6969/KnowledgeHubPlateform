const articleService = require('./article.service');

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
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ArticleController();
