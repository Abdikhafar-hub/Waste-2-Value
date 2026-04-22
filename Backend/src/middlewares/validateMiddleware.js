const { BadRequestError } = require('../utils/errors');

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!result.success) {
      return next(new BadRequestError('Validation failed', result.error.errors));
    }
    req.validated = result.data;
    req.body = result.data.body || req.body;
    req.params = result.data.params || req.params;
    req.query = result.data.query || req.query;
    return next();
  };
}

module.exports = validate;
