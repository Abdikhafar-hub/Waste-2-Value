const { z, idParam, paginationQuery, positiveDecimal } = require('../../utils/validators');

const createSubmissionSchema = z.object({
  body: z.object({
    zoneId: z.string().min(1),
    collectionPointId: z.string().optional(),
    wasteType: z.enum(['ORGANIC', 'PLASTIC']),
    weightKg: positiveDecimal,
    tagCode: z.string().optional(),
    source: z.enum(['MANUAL', 'QR', 'NFC', 'API']).optional(),
    imageUrl: z.string().url().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

const updateSubmissionSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    notes: z.string().optional(),
    imageUrl: z.string().url().optional(),
    tagCode: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

const transitionNoteSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    note: z.string().optional(),
  }).optional().default({}),
});

const rejectSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    note: z.string().min(1),
  }),
});

const assignSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    processorUserId: z.string().min(1),
    processingCenterId: z.string().optional(),
    note: z.string().optional(),
  }),
});

const tagSchema = z.object({
  body: z.object({
    code: z.string().min(2),
    type: z.string().optional(),
  }),
});

const listSchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ASSIGNED', 'RECEIVED', 'PROCESSING', 'PROCESSED', 'CONVERTED', 'ARCHIVED']).optional(),
    wasteType: z.enum(['ORGANIC', 'PLASTIC']).optional(),
    collectorUserId: z.string().optional(),
    processorUserId: z.string().optional(),
    zoneId: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

module.exports = {
  createSubmissionSchema,
  updateSubmissionSchema,
  transitionNoteSchema,
  rejectSchema,
  assignSchema,
  tagSchema,
  listSchema,
};
