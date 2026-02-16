try {
    const app = require('../backend/dist/index.js');
    module.exports = app;
} catch (error) {
    console.error('Failed to load backend:', error);
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'Backend failed to load',
            details: error.message,
            stack: error.stack
        });
    };
}
