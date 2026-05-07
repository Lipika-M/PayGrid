import express, { urlencoded } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { ApiError } from './utils/apiError.js';

const app = express();
app.use(helmet());
app.use(morgan("combined"));
app.use(cors(
    {
        origin: env.CORS_ORIGIN,
        credentials: true
    }
));
app.use(express.json({limit:"16kb"}));
app.use(urlencoded({extended: true, limit:"16kb"}));
app.use(express.static('public'));
app.use(cookieParser());

import userRouter from "./routers/user.router.js"
import walletRouter from "./routers/wallet.router.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/wallets", walletRouter)

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.error
        });
    }

    console.error(err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});
export { app }