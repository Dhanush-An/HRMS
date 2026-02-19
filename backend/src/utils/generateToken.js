const jwt = require('jsonwebtoken');
const config = require('../config/jwt');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, config.secret, {
        expiresIn: config.expiresIn
    });
};

module.exports = generateToken;
