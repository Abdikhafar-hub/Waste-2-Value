const { z, idParam, paginationQuery } = require('../../utils/validators');

const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
  }),
});

const updateOrganizationStatusSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  }),
});

const createOrgAdminSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    email: z.string().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
    profile: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      address: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  }),
});

const listSchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
    search: z.string().optional(),
  }),
});

const listUsersSchema = z.object({
  query: paginationQuery.extend({
    role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'COLLECTOR', 'PROCESSOR', 'BUYER']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
    organizationId: z.string().optional(),
    search: z.string().optional(),
  }),
});

const updateUserStatusSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
  }),
});

module.exports = {
  createOrganizationSchema,
  updateOrganizationStatusSchema,
  createOrgAdminSchema,
  listSchema,
  listUsersSchema,
  updateUserStatusSchema,
};
