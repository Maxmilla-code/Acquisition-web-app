import logger from "#config/logger.js";
import bcrypt from 'bcrypt';
import { users } from "#models/user.model.js";
import { db } from '#config/database.js';
import { eq } from "drizzle-orm";

export const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (e) {
        logger.error(`Error hashing the password: ${e}`);
        throw new Error('Error hashing');
    }
};

export const comparePassword = async (password, hash) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (e) {
        logger.error(`Error comparing the password: ${e}`);
        throw new Error('Error comparing');
    }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) throw new Error("user with this email already exists");
        const passwordHash = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
            name,
            email,
            password: passwordHash,
            role
        }).returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            created_at: users.created_at
        });

        logger.info(`user ${newUser.email} created successfully`);
        return newUser;

    } catch (e) {
        logger.error(`Creating the user: ${e}`);
        throw e;
    }
};

export const authenticateUser = async ({ email, password }) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            throw new Error('invalid credentials');
        }

        const valid = await comparePassword(password, user.password);
        if (!valid) {
            throw new Error('invalid credentials');
        }

        return user;
    } catch (e) {
        logger.error(`Authenticating the user: ${e}`);
        throw e;
    }
};
