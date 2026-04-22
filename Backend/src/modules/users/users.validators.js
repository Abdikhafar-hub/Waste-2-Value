const { z, idParam, paginationQuery } = require('../../utils/validators');

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  nationalId: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  address: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
    role: z.enum(['COLLECTOR', 'PROCESSOR', 'BUYER']),
    profile: profileSchema,
    buyerProfile: z.object({
      businessName: z.string().optional(),
      buyerType: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      notes: z.string().optional(),
    }).optional(),
  }),
});

const updateUserSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    profile: profileSchema.partial().optional(),
    buyerProfile: z.object({
      businessName: z.string().optional(),
      buyerType: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      notes: z.string().optional(),
    }).optional(),
  }),
});

const updateStatusSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
  }),
});

const listUsersSchema = z.object({
  query: paginationQuery.extend({
    role: z.enum(['ORG_ADMIN', 'COLLECTOR', 'PROCESSOR', 'BUYER']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
    search: z.string().optional(),
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  listUsersSchema,
};
