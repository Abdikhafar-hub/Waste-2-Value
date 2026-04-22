const { z } = require('zod');

const idParam = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const userIdParam = z.object({
  params: z.object({ userId: z.string().min(1) }),
});

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const positiveDecimal = z.coerce.number().positive();
const nonNegativeDecimal = z.coerce.number().min(0);
const optionalDate = z.coerce.date().optional();

module.exports = {
  z,
  idParam,
  userIdParam,
  paginationQuery,
  positiveDecimal,
  nonNegativeDecimal,
  optionalDate,
};
