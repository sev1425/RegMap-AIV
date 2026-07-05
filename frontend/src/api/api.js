import axios from "axios";

/* ==========================================================
   REGMAP AI ENTERPRISE API CLIENT
========================================================== */

const api = axios.create({

    baseURL: "http://127.0.0.1:5000",

    timeout: 120000,

    headers: {

        "Content-Type": "application/json"

    }

});

/* ==========================================================
   REQUEST INTERCEPTOR
========================================================== */

api.interceptors.request.use(

    (config) => {

        console.log(

            `🚀 ${config.method?.toUpperCase()} ${config.url}`

        );

        return config;

    },

    (error) => {

        return Promise.reject(error);

    }

);

/* ==========================================================
   RESPONSE INTERCEPTOR
========================================================== */

api.interceptors.response.use(

    (response) => {

        return response;

    },

    (error) => {

        if (error.response) {

            console.error(

                "API Error",

                error.response.status,

                error.response.data

            );

        }

        else if (error.request) {

            console.error(

                "Backend not reachable."

            );

        }

        else {

            console.error(

                error.message

            );

        }

        return Promise.reject(error);

    }

);

export default api;