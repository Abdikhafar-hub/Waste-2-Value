const { BadRequestError } = require('./errors');

function getPagination(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

function getSort(query, allowedFields, defaultField = 'createdAt') {
  const sortBy = query.sortBy || defaultField;
  if (!allowedFields.includes(sortBy)) {
    throw new BadRequestError(`Invalid sort field: ${sortBy}`);
  }
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { [sortBy]: sortOrder };
}

function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };
}

module.exports = { getPagination, getSort, buildMeta };
