function sendSuccess(res, message, data = null, meta = undefined, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

function sendError(res, message, errors = undefined, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

module.exports = { sendSuccess, sendError };
