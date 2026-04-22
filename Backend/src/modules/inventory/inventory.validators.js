const { z, idParam, paginationQuery } = require('../../utils/validators');

module.exports = {
  listSchema: z.object({
    query: paginationQuery.extend({
      productId: z.string().optional(),
      type: z.enum(['PRODUCTION_IN', 'SALE_OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGE']).optional(),
    }),
  }),
  adjustmentSchema: z.object({
    body: z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().refine((value) => value !== 0, 'Quantity cannot be zero'),
      unit: z.string().min(1),
      notes: z.string().optional(),
    }),
  }),
};
