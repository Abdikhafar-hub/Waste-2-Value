const { z, idParam, paginationQuery, positiveDecimal } = require('../../utils/validators');

const createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().min(1),
      quantity: positiveDecimal,
    })).min(1).refine((items) => new Set(items.map((item) => item.productId)).size === items.length, 'Duplicate product lines are not allowed'),
    notes: z.string().optional(),
    delivery: z.object({
      recipientName: z.string().optional(),
      recipientPhone: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
  }),
});

const listSchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED']).optional(),
    paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED']).optional(),
    deliveryStatus: z.enum(['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED']).optional(),
    buyerUserId: z.string().optional(),
  }),
});

const orderStatusSchema = z.object({
  params: idParam.shape.params,
  body: z.object({ status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED']) }),
});

const paymentStatusSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED']),
    amount: z.coerce.number().nonnegative().optional(),
    method: z.string().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const deliveryStatusSchema = z.object({
  params: idParam.shape.params,
  body: z.object({
    deliveryStatus: z.enum(['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED']),
    notes: z.string().optional(),
  }),
});

module.exports = { createOrderSchema, listSchema, orderStatusSchema, paymentStatusSchema, deliveryStatusSchema };
