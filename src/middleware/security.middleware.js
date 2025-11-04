import aj from '#config/arcject.js';
import { slidingWindow } from "@arcjet/node";
import logger from "#config/logger.js";

const securityMiddleware = async (req, res, next) => {
    try {
        const role = req.user?.role || 'guest';
        let limit;
        let message;

        switch (role) {
            case 'admin':
                limit = 20;
                message = 'Admin request limit exceed (20 per minute). slow down.';
                break;
            case 'user':
                limit = 10;
                message = 'Admin request limit exceed (10 per minute). slow down.';
                break;
            case 'guest':
                limit = 5;
                message = 'Admin request limit exceed (50 per minute). slow down.';
                break;
        }

        const client = aj.withRule(
            slidingWindow({
                mode: 'LIVE',
                interval: '1m',
                max: limit,
                name: `${role}-rate-limit`
            })
        );

        const decision = await client.protect(req);

        if (decision.isDenied() && decision.reason.isBot()) {
            logger.warn(`Bot request is blocked`, {
                ip: req.ip,
                userAgent: req.get('user-Agent'),
                path: req.path
            });
            return res.status(403).json({
                error: 'forbidden',
                message: 'automated requests are not allowed'
            });
        }

        if (decision.isDenied() && decision.reason.isShield()) {
            logger.warn('Shield blocked the request', {
                ip: req.ip,
                userAgent: req.get('user-Agent'),
                path: req.path,
                method: req.method
            });
            return res.status(403).json({
                error: 'forbidden',
                message: 'automated blocked by the security policies'
            });
        }

        if (decision.isDenied() && decision.reason.isRateLimit()) {
            logger.warn(`Rate limit exceed`, {
                ip: req.ip,
                userAgent: req.get('user-Agent'),
                path: req.path
            });
            return res.status(403).json({
                error: 'forbidden',
                message: 'too many requests'
            });
        }

        next();
    } catch (e) {
        console.error('arcjet middleware error:', e);
        res.status(500).json({
            error: 'internal server error',
            message: 'something went wrong with the security middleware'
        });
    }
};
export default securityMiddleware;
