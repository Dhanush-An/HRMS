const path = require('path');

const DATA_DIR = process.env.VERCEL
    ? path.join(process.cwd(), 'backend/data')
    : path.join(__dirname, '../../data');

module.exports = {
    DATA_DIR
};
