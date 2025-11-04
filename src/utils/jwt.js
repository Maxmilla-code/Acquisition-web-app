import jwt from 'jsonwebtoken';
import logger from "#config/logger.js";
import { cookies } from "#utils/cookies.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-please-change-in-production";
const JWT_EXPIRES_IN = '1d';

export const jwttoken = {
    sign: (payload) =>{
        try{
            return jwt.sign(payload, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});
        } catch(e){
            logger.error('failed to authenticate the token', e);
            throw new Error('Failed to authenticate the token');
        }
    },
    verify: (token) =>{
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch(e){
            logger.error('failed to authenticate the token', e);
            throw new Error('Failed to authenticate the token');
        }
    },
    clear: (res, name, options ={}) =>{
        res.clearCookie(name, { ...cookies.getOptions(), ...options});
    },
    get: (req, name) =>{
        return req?.cookies?.[name];
    }


}
