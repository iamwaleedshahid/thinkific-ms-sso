const jwt = require('jsonwebtoken');
require('dotenv').config();


// Generate token
function generateToken(payload) {
    const token = jwt.sign(payload, process.env.THINKIFIC_API_KEY);
    return token;
}

module.exports = { generateToken }
