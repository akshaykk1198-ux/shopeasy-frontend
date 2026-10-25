const hits = new Map();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}, 10 * 60 * 1000).unref();

const rateLimit = ({ windowMs, max }) => (req, res, next) => {
  const now = Date.now();
  const key = req.ip;
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (entry.count >= max) {
    return res.status(429).json({ message: 'Too many requests. Please wait a few minutes and try again.' });
  }

  entry.count += 1;
  next();
};

module.exports = rateLimit;