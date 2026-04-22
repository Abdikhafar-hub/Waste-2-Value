const { z, idParam, paginationQuery } = require('../../utils/validators');

const coordinate = z.coerce.number().optional();

const zoneBody = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  latitude: coordinate,
  longitude: coordinate,
  isActive: z.boolean().optional(),
});

const locationBody = z.object({
  zoneId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  latitude: coordinate,
  longitude: coordinate,
  isActive: z.boolean().optional(),
});

const processingCenterBody = locationBody.extend({ zoneId: z.string().optional() });

const listSchema = z.object({
  query: paginationQuery.extend({
    isActive: z.coerce.boolean().optional(),
    zoneId: z.string().optional(),
    search: z.string().optional(),
  }),
});

module.exports = {
  createZoneSchema: z.object({ body: zoneBody }),
  updateZoneSchema: z.object({ params: idParam.shape.params, body: zoneBody.partial() }),
  createCollectionPointSchema: z.object({ body: locationBody }),
  updateCollectionPointSchema: z.object({ params: idParam.shape.params, body: locationBody.partial() }),
  createProcessingCenterSchema: z.object({ body: processingCenterBody }),
  updateProcessingCenterSchema: z.object({ params: idParam.shape.params, body: processingCenterBody.partial() }),
  listSchema,
};
