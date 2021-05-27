const mongoose = require("mongoose");
const Schema = mongoose.Schema

const TokenSchema = new Schema({
    accessToken: {
        type: String
    },
    refreshToken: {
        type: String
    },
    user_id: {
        type: String
    }
})

module.exports = Token = mongoose.model("Tokens", TokenSchema)