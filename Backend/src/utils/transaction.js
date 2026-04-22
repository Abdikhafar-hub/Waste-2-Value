const { Prisma } = require('@prisma/client');

async function runTransactionWithRetry(prisma, callback, options = {}) {
  const {
    retries = 3,
    isolationLevel = Prisma.TransactionIsolationLevel.Serializable,
    maxWait = 5000,
    timeout = 10000,
  } = options;

  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await prisma.$transaction(callback, { isolationLevel, maxWait, timeout });
    } catch (error) {
      const isRetryableSerializationError = error?.code === 'P2034';
      if (!isRetryableSerializationError || attempt === retries) throw error;
      attempt += 1;
    }
  }
}

module.exports = { runTransactionWithRetry };
