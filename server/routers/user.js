const express = require("express");
const auth = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Token = require("../models/Token")
const { generateAccessToken, generateRefreshToken, addTokensToDB } = require("../generateTokens/generateTokens")
const { secret } = require("../generateTokens/configTokens/configTokens").jwt;
const updateTokensMiddleware = require("../middleware/updateTokensMiddleware");
const authMiddleware = require("../middleware/authMiddleware")

const generateTokens = (user_id) => {
    const accessToken = generateAccessToken(user_id);
    const refreshToken = generateRefreshToken(user_id);

    return {
        accessToken,
        refreshToken
    }
};

const updateTokens = (refreshToken) => {

    let payloadRefreshToken = jwt.verify(refreshToken, secret);
    const tokens = generateTokens(payloadRefreshToken.user_id);
    addTokensToDB(tokens.accessToken, tokens.refreshToken, payloadRefreshToken.user_id);

    return tokens;

};

auth.post("/signup", (req, res) => {

    const userData = {
        type_id: null,
        user_id: req.body.user_id,
        password: req.body.password
    };

    const emailRegex = RegExp(
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    const phoneRegex = RegExp(
        /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/
    )

    const signup = userData => {
        User.findOne({
            user_id: userData.user_id,
        })
            .then((user) => {
                if (!user) {
                    bcrypt.hash(userData.password, 10, (error, hash) => {
                        userData.password = hash;
                        User.create(userData)
                            .then((user) => {
                                res.status(200).json({ status: "Пользователь " + user.user_id + " зарегистрирован!" });
                            })
                            .catch((error) => {
                                res.send("error: " + error);
                            });
                    });
                } else {
                    res.status(401).json({ status: "Пользователь с таким id уже существует!" });
                }
            })
            .catch((error) => {
                res.send("error: " + error);
            });
    }

    if (emailRegex.test(req.body.user_id)) {

        userData.type_id = "Email"
        signup(userData);
    }
    else if (phoneRegex.test(req.body.user_id)) {
        userData.type_id = "Phone"
        signup(userData);

    } else {
        res.status(400).json({ status: "Такой id не предусмотрен!" })
    }
});

auth.post("/signin", (req, res) => {
    User.findOne({
        user_id: req.body.user_id,
    })
        .then((user) => {
            if (user) {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    const tokens = generateTokens(req.body.user_id);
                    addTokensToDB(tokens.accessToken, tokens.refreshToken, req.body.user_id)
                    res.status(200).json({
                        status: "Авторизация успешна",
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken
                    });
                } else {
                    res.status(401).json({ status: "Логин или пароль неверен" });
                }
            } else {
                res.status(401).json({ status: "Логин или пароль неверен" });
            }
        })
        .catch((err) => {
            res.send("error: " + err);
        });
});
auth.get("/updateTokens", updateTokensMiddleware, (req, res) => {
    const authHeader = req.get("Authorization");
    const token = authHeader.replace("Bearer ", "");

    const tokens = updateTokens(token)

    res.status(200).json({
        status: "Токены обновлены!",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    });
})
auth.get("/logout", authMiddleware, (req, res) => {

    const authHeader = req.get("Authorization");

    const payload = jwt.verify(authHeader.replace("Bearer ", ""), secret);

    Token.findOneAndDelete({ user_id: payload.user_id })
        .then((token) => {
            if (token != null) {
                res.status(200).json({ status: "Вы разлогинились!" })
            }
            else {
                res.status(404).json({ status: "Вы не авторизованны!" })
            }
        })

})
auth.get("/info", authMiddleware, async (req, res) => {
    const authHeader = req.get("Authorization");
    const accessToken = authHeader.replace("Bearer ", "");
    const payload = jwt.verify(accessToken, secret);

    const info = await User.findOne({ user_id: payload.user_id }).then((user) => {
        if (user) {
            return user;
        };
    });

    const refreshToken = await Token.findOne({ user_id: payload.user_id }).then((tokens) => {
        if (tokens) {
            return tokens.refreshToken;
        }
    });
    if (info != null) {

        try {
            
            jwt.verify(refreshToken, secret);
            const newTokens =  updateTokens(refreshToken);
            const data = {
                info,
                newTokens
            }
            return res.status(200).json(data);

        } catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                
                res.json(info);
                return;
            }
            if (e instanceof jwt.JsonWebTokenError) {
                
                res.json(info);
                return;
            }
        }

    } else return res.status(404).json("Пользователь не найден!");

})
module.exports = {
    auth,
};
