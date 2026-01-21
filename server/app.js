require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const axios = require('axios');

const app = express();

// Middleware
app.use(morgan('dev'));

const cache = new Map();

// app.get("/", (req, res) => {
//     res.send("TEST WORKING! hmm");
// })

app.get("/", async (req, res) => {
    const i = req.query.i;
    const t = req.query.t;

    if (!i && !t) {
        return res.status(400).json({ error: "Need to provide i or t query parameter" });
    }

    if (i && t) {
        return res.status(400).json({ error: "Provide only i or t" });
    }

    const cacheKey = makeCacheKey({ i, t });

    if (cache.has(cacheKey)) {
        console.log(`retrieving ${cacheKey} from cache`);
        return res.json(cache.get(cacheKey));
    }

    try {
        console.log(`${cacheKey} was not cached, hitting API`);

        const response = await axios.get("https://www.omdbapi.com/", {
            params: {
                apikey: process.env.OMDB_API_KEY,
                ...(i ? { i } : {}),
                ...(t ? { t } : {})
            },
            timeout: 10000,
        });

        const data = response.data;

        if (data?.Response === "False") {
            return res.status(400).json(data);
        }

        cache.set(cacheKey, data);
        res.json(data);
    } catch (error) {
        // console.error("Axios error message:", error.message);

        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }

        // if (error.response) {
        //     console.error("Status:", error.response.status);
        //     console.error("Data:", error.response.data);
        // }

        // if (error.request) {
        //     console.error("No response received:", error.request?.host);
        // }

        res.status(500).json({ error: "Error getting movie data", details: error.message });
    }
});

//// HELPER METHODS
function makeCacheKey({ i, t }) {
    if (i) return `i:${i}`;
    return `t:${String(t).trim().toLowerCase()}`;
}

module.exports = app;