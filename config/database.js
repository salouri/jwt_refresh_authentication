"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const getEnvVar_1 = __importDefault(require("../src/utils/getEnvVar"));
dotenv_1.default.config();
dotenv_1.default.config({ path: './config.env' });
const connectDB = async () => {
    try {
        const password = (0, getEnvVar_1.default)('DB_PASSWORD');
        const databaseURI = (0, getEnvVar_1.default)('CONNECTION_STRING')
            .replace('<PASSWORD>', password)
            .replace('<USERNAME>', (0, getEnvVar_1.default)('DB_USER'))
            .replace('<DATABASE>', (0, getEnvVar_1.default)('DB_NAME'));
        const connectOptions = {
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
            ssl: true,
        };
        await mongoose_1.default.connect(databaseURI, connectOptions);
        console.log('Database Connection Successful...');
    }
    catch (error) {
        console.error('Database connection failed!');
        throw new Error(error.message);
    }
};
exports.default = connectDB;
