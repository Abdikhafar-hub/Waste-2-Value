const { z, idParam, paginationQuery, positiveDecimal } = require('../../utils/validators');

const listTransactionsSchema = z.object({
  query: paginationQuery.extend({
    userId: z.string().optional(),
    type: z.enum(['CREDIT_EARNED', 'CREDIT_ADJUSTMENT', 'CREDIT_REDEEMED', 'CREDIT_REWARD', 'CREDIT_REVERSAL']).optional(),
  }),
});

const redemptionSchema = z.object({
  body: z.object({
    amount: positiveDecimal,
    requestedItem: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const reviewRedemptionSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    notes: z.string().optional(),
  }).optional().default({}),
});

const adjustmentSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    amount: z.coerce.number().refine((value) => value !== 0, 'Amount cannot be zero'),
    description: z.string().min(3),
    metadata: z.record(z.any()).optional(),
  }),
});

module.exports = {
  listTransactionsSchema,
  listRedemptionsSchema: z.object({ query: paginationQuery }),
  redemptionSchema,
  reviewRedemptionSchema,
  adjustmentSchema,
};
