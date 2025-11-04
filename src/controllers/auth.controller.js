import logger from "#config/logger.js";
import { signupSchema, signinSchema } from "#validations/auth.validations.js";
import { formatValidationError } from "#utils/format.js";
import { createUser, authenticateUser } from "#services/auth.service.js";
import { jwttoken } from "#utils/jwt.js";
import { cookies } from "#utils/cookies.js";

export const signup = async (req, res, next) => {
    try {
        const validationResult = signupSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: "validation failed",
                details: formatValidationError(validationResult.error),
            });
        }

        const { name, email, role, password } = validationResult.data;

        const user = await createUser({ name, email, password, role });
        const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
        cookies.set(res, "token", token);

        logger.info(`user registered successfully: ${email}`);

        res.status(201).json({
            message: "user registered",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (e) {
        logger.error(`signup error: ${e.message}`, e);
        if (e.message === "user with this email already exists") {
            return res.status(409).json({ error: "email already exists" });
        }
        next(e);
    }
};

export const signin = async (req, res, next) => {
    try {
        const validationResult = signinSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: "validation failed",
                details: formatValidationError(validationResult.error),
            });
        }

        const { email, password } = validationResult.data;

        const user = await authenticateUser({ email, password });
        const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
        cookies.set(res, "token", token);

        logger.info(`user logged in successfully: ${email}`);

        res.status(200).json({
            message: "user logged in",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (e) {
        logger.error(`signin error: ${e.message}`, e);
        if (e.message === "invalid credentials" || e.message === "user not found") {
            return res.status(401).json({ error: "invalid credentials" });
        }
        next(e);
    }
};

export const signout = async (req, res, next) => {
    try {
        res.clearCookie("token", cookies.getOptions());
        logger.info(`user signed out`);
        res.status(200).json({ message: "user signed out" });
    } catch (e) {
        logger.error(`signout error: ${e.message}`, e);
        next(e);
    }
};
