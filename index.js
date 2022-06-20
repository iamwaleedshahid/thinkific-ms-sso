const express = require("express");
const msal = require('@azure/msal-node');
require('dotenv').config();
const { generateToken } = require('./utils/generateJWT');

const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI = process.env.MS_REDIRECT_URI;


const config = {
    auth: {
        clientId: process.env.MS_CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        clientSecret: process.env.MS_CLIENT_SECRET,
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

const pca = new msal.ConfidentialClientApplication(config);

const app = express();

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    // get url to sign user in and consent to scopes needed for application
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/callback', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    console.log(tokenRequest);

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        const user = response.account.idTokenClaims
        const payload = {
            "first_name": user.given_name,
            "last_name": user.family_name,
            "email": user.email,
            "iat": Math.floor(Date.now() / 1000),
        }
        const token = generateToken(payload);

        const url = `https://${process.env.THINKIFIC_SUBDOMAIN}.thinkific.com/api/sso/v2/sso/jwt?jwt=${token}&return_to=${process.env.THINKIFIC_REDIRECT}&error_url=${process.env.THINKIFIC_ERROR}`;

        res.redirect(url);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});


app.listen(SERVER_PORT, () => console.log(`App is running on: ${SERVER_PORT}`))
