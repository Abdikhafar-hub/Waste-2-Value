const prisma = require('../db/prisma');
const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

async function authenticate(req, _res, next) {
  try {
    const header = req.get('authorization');
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true, organization: true },
    });
    if (!user) throw new UnauthorizedError('Invalid authentication token');
    if (user.status !== 'ACTIVE') throw new ForbiddenError('Account is not active');
    if (user.organizationId && user.organization?.status !== 'ACTIVE') {
      throw new ForbiddenError('Organization is not active');
    }
    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
    };
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired authentication token'));
    }
    return next(error);
  }
}

module.exports = authenticate;
