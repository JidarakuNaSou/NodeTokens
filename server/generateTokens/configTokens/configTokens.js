module.exports = {
    jwt: {
        secret: "secret",
        tokens: {
            access:{
                type: "access",
                expiresIn: "800h"
            },
            refresh: {
                type: "refresh",
                expiresIn: "30m"
            }
        }
    }
}