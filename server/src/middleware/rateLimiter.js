import rateLimit from 'express-rate-limit';

export const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many attendance marking attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    const requestId = req.headers['x-attendance-session-id'] || req.headers['x-request-id'] || 'untracked';
    console.warn('[Attendance] rate limit exceeded', {
      requestId,
      ip: req.ip,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    });
    res.set('Retry-After', String(Math.ceil(options.windowMs / 1000)));
    res.status(options.statusCode).json({ success: false, message: options.message });
  },
});
