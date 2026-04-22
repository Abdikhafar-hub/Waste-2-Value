const env = require('./env');

const levels = ['error', 'warn', 'info', 'debug'];
const activeLevel = levels.includes(env.LOG_LEVEL) ? env.LOG_LEVEL : 'info';

function shouldLog(level) {
  return levels.indexOf(level) <= levels.indexOf(activeLevel);
}

function write(level, message, meta = {}) {
  if (!shouldLog(level)) return;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    process.stderr.write(`${line}\n`);
  } else {
    process.stdout.write(`${line}\n`);
  }
}

module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};
