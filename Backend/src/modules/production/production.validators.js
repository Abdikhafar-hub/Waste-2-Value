const { z, idParam, paginationQuery, positiveDecimal } = require('../../utils/validators');

const createBatchSchema = z.object({
  body: z.object({
    wasteType: z.enum(['ORGANIC', 'PLASTIC']),
    processingCenterId: z.string().optional(),
    wasteSubmissionIds: z.array(z.string().min(1)).min(1).refine((value) => new Set(value).size === value.length, 'wasteSubmissionIds must be unique'),
    notes: z.string().optional(),
  }),
});

const updateBatchSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    notes: z.string().optional(),
    status: z.enum(['DRAFT', 'IN_PROGRESS', 'CANCELLED']).optional(),
  }),
});

const completeBatchSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    outputs: z.array(z.object({
      productId: z.string().min(1),
      quantity: positiveDecimal,
      unit: z.string().min(1),
      notes: z.string().optional(),
    })).min(1),
    notes: z.string().optional(),
  }),
});

const listSchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    processorUserId: z.string().optional(),
    wasteType: z.enum(['ORGANIC', 'PLASTIC']).optional(),
  }),
});

module.exports = { createBatchSchema, updateBatchSchema, completeBatchSchema, listSchema };
