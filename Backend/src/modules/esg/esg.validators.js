const { z } = require('../../utils/validators');

const periodQuery = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

module.exports = {
  periodQuery,
  runReportSchema: z.object({
    body: z.object({
      periodStart: z.coerce.date(),
      periodEnd: z.coerce.date(),
    }),
  }),
};
