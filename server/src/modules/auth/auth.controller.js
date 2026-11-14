const authService = require('./auth.service');
const { getRefreshTokenCookieOptions, getClearCookieOptions } = require('../../utils/tokens');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      // Set HttpOnly cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      res.status(201).json({
        user: result.user,
        tenant: result.tenant,
        membership: result.membership,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);

      // Set HttpOnly cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json({
        user: result.user,
        memberships: result.memberships,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const result = await authService.refresh(refreshToken);

      res.status(200).json(result);
    } catch (err) {
      // Clear invalid cookie
      res.clearCookie('refreshToken', getClearCookieOptions());
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const result = await authService.logout(refreshToken);

      res.clearCookie('refreshToken', getClearCookieOptions());
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const result = await authService.me(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
