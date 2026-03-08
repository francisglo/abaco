/**
 * Middleware de logging
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Capturar datos después de que se envíe la respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 50) || 'N/A',
      userId: req.user?.id || 'anonymous'
    };

    // Log en console
    const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️' : '✅';
    console.log(`${statusColor} [${log.timestamp}] ${log.method} ${log.path} → ${log.status} (${log.duration})`);
  });

  next();
}
