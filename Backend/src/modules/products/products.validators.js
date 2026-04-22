const { z, idParam, paginationQuery, nonNegativeDecimal } = require('../../utils/validators');

const productBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  category: z.enum(['LARVAE', 'FERTILIZER', 'BRICKS', 'GARDEN_STAKES', 'OTHER']),
  unit: z.string().min(1),
  sellingPrice: nonNegativeDecimal,
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

module.exports = {
  listSchema: z.object({
    query: paginationQuery.extend({
      category: z.enum(['LARVAE', 'FERTILIZER', 'BRICKS', 'GARDEN_STAKES', 'OTHER']).optional(),
      search: z.string().optional(),
      isActive: z.coerce.boolean().optional(),
    }),
  }),
  createProductSchema: z.object({ body: productBody }),
  updateProductSchema: z.object({ params: idParam.shape.params, body: productBody.partial() }),
  updateStatusSchema: z.object({
    params: idParam.shape.params,
    body: z.object({ isActive: z.boolean() }),
  }),
};
