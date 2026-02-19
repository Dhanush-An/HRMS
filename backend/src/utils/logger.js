const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()}: ${message}`),
    error: (error) => console.error(`[ERROR] ${new Date().toISOString()}:`, error),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()}: ${message}`)
};

module.exports = logger;
