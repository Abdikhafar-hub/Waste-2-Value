const { z, idParam, paginationQuery } = require('../../utils/validators');

const insightBody = z.object({
  zoneId: z.string().optional(),
  type: z.enum(['PREDICTION', 'ROUTE_RECOMMENDATION', 'INEFFICIENCY_FLAG', 'HOTSPOT', 'OTHER']),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.string().optional(),
  payload: z.record(z.any()).default({}),
  generatedAt: z.coerce.date().optional(),
});

module.exports = {
  listSchema: z.object({
    query: paginationQuery.extend({
      zoneId: z.string().optional(),
      type: z.enum(['PREDICTION', 'ROUTE_RECOMMENDATION', 'INEFFICIENCY_FLAG', 'HOTSPOT', 'OTHER']).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    }),
  }),
  createInsightSchema: z.object({ body: insightBody }),
  idParam,
};
