// Central JSON error responder. `next(err)` from any handler lands here.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', req.method, req.originalUrl, '-', err.message);

  // Postgres unique-violation -> 409 (e.g. duplicate email on register).
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Resource already exists' });
  }
  // Invalid UUID format in a param -> 400 instead of a 500.
  if (err.code === '22P02') {
    return res.status(400).json({ success: false, message: 'Invalid identifier format' });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = { errorHandler };
