const jwt = require("jsonwebtoken");
const { tokens, secret } = require("./configTokens/configTokens").jwt;
const Token = require("../models/Token")

const generateAccessToken = (user_id) => {
    const payload = {
        user_id,
        type: tokens.access.type
    };
    const option = { expiresIn: tokens.access.expiresIn };

    return jwt.sign(payload, secret, option);
}

const generateRefreshToken = (user_id) => {
    const payload = {
        user_id,
        type: tokens.refresh.type
    };
    const option = { expiresIn: tokens.refresh.expiresIn };

    return jwt.sign(payload, secret, option)

}
const addTokensToDB = (accessToken,refreshToken, user_id) =>
    Token.findOneAndDelete({ user_id })
        .exec()
        .then(() => { Token.create({ accessToken,refreshToken, user_id }) })

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    addTokensToDB
}