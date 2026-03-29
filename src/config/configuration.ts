export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mercadolibre: {
    clientId: process.env.ML_CLIENT_ID,
    clientSecret: process.env.ML_CLIENT_SECRET,
    redirectUri: process.env.ML_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    siteId: process.env.ML_SITE_ID || 'MLB',
    authUrl: process.env.ML_AUTH_URL || 'https://auth.mercadolibre.com/authorization',
    tokenUrl: process.env.ML_TOKEN_URL || 'https://api.mercadolibre.com/oauth/token',
    apiBase: process.env.ML_API_BASE || 'https://api.mercadolibre.com',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  session: {
    secret: process.env.SESSION_SECRET || 'keyboard-cat-change-this',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
  },
});
