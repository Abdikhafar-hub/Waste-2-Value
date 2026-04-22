const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./db/prisma');

const server = app.listen(env.PORT, () => {
  logger.info(`Waste2Value API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  logger.info(`Received ${signal}; shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
