const { z, paginationQuery, positiveDecimal, nonNegativeDecimal } = require('../../utils/validators');

const listSchema = z.object({
  query: paginationQuery.extend({
    isActive: z.coerce.boolean().optional(),
    energyUnitId: z.string().optional(),
    energyConsumerId: z.string().optional(),
  }),
});

module.exports = {
  listSchema,
  unitSchema: z.object({
    body: z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      capacity: nonNegativeDecimal.optional(),
      isActive: z.boolean().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  }),
  consumerSchema: z.object({
    body: z.object({
      name: z.string().min(1),
      type: z.string().optional(),
      contact: z.string().optional(),
      address: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
  }),
  productionSchema: z.object({
    body: z.object({
      energyUnitId: z.string().min(1),
      quantity: positiveDecimal,
      unit: z.string().min(1),
      recordedAt: z.coerce.date(),
      notes: z.string().optional(),
    }),
  }),
  usageSchema: z.object({
    body: z.object({
      energyConsumerId: z.string().min(1),
      quantity: positiveDecimal,
      unit: z.string().min(1),
      recordedAt: z.coerce.date(),
      notes: z.string().optional(),
    }),
  }),
  paymentSchema: z.object({
    body: z.object({
      energyConsumerId: z.string().min(1),
      amount: positiveDecimal,
      status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED']),
      reference: z.string().optional(),
      paidAt: z.coerce.date().optional(),
      notes: z.string().optional(),
    }),
  }),
};
