import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
axios.defaults.withCredentials = true;

export const apiInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BRIDGE_API_URL,

    withCredentials: false
});

export const indexerInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BRIDGE_API_URL,

    withCredentials: false
});