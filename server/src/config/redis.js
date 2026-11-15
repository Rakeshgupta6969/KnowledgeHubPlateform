const Redis = require('ioredis');
const config = require('./environment');

let redisClient = null;
let isConnected = false;

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      // Reconnect after delay, cap at 5 seconds
      return Math.min(times * 200, 5000);
    },
    lazyConnect: true,
    enableOfflineQueue: false, // Prevents queuing commands indefinitely when Redis is down
  });

  redisClient.on('connect', () => {
    isConnected = true;
  });

  redisClient.on('ready', () => {
    isConnected = true;
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    // Suppress spamming unhandled error events
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Redis Warning] Cache unavailable: ${err.message}`);
    }
  });

  redisClient.on('close', () => {
    isConnected = false;
  });

  // Connect asynchronously in background
  redisClient.connect().catch(() => {
    isConnected = false;
  });
} catch (err) {
  isConnected = false;
  console.warn(`[Redis Init Warning] Could not initialize client: ${err.message}`);
}

const cacheService = {
  isAvailable() {
    return isConnected && redisClient && redisClient.status === 'ready';
  },

  async get(key) {
    if (!this.isAvailable()) return null;
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (err) {
      console.warn(`[Redis Get Warning] Error retrieving key ${key}: ${err.message}`);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 900) {
    if (!this.isAvailable()) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.warn(`[Redis Set Warning] Error writing key ${key}: ${err.message}`);
      return false;
    }
  },

  async del(key) {
    if (!this.isAvailable()) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.warn(`[Redis Del Warning] Error deleting key ${key}: ${err.message}`);
      return false;
    }
  },

  async delPattern(pattern) {
    if (!this.isAvailable()) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (err) {
      console.warn(`[Redis DelPattern Warning] Error deleting pattern ${pattern}: ${err.message}`);
      return false;
    }
  },

  // Tenant-scoped key builders
  keys: {
    tenant: (tenantSlug) => `tenant:${tenantSlug.toLowerCase()}`,
    categories: (tenantSlug) => `categories:${tenantSlug.toLowerCase()}`,
    article: (tenantSlug, articleSlug) =>
      `article:${tenantSlug.toLowerCase()}:${articleSlug.toLowerCase()}`,
  },

  // Invalidation helpers
  async invalidateTenant(tenantSlug) {
    if (!tenantSlug) return;
    await this.del(this.keys.tenant(tenantSlug));
  },

  async invalidateCategories(tenantSlug) {
    if (!tenantSlug) return;
    await this.del(this.keys.categories(tenantSlug));
  },

  async invalidateArticle(tenantSlug, articleSlug) {
    if (!tenantSlug) return;
    if (articleSlug) {
      await this.del(this.keys.article(tenantSlug, articleSlug));
    }
    // Also invalidate categories because article counts might change
    await this.del(this.keys.categories(tenantSlug));
  },

  async invalidateAllForTenant(tenantSlug) {
    if (!tenantSlug) return;
    await Promise.all([
      this.del(this.keys.tenant(tenantSlug)),
      this.del(this.keys.categories(tenantSlug)),
      this.delPattern(`article:${tenantSlug.toLowerCase()}:*`),
    ]);
  },

  // Close connection for testing cleanup
  async disconnect() {
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch {
        redisClient.disconnect();
      }
    }
  },
};

module.exports = cacheService;
