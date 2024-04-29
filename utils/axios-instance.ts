import { appConfig } from '@/config/default';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
axios.defaults.withCredentials = true;

export const apiInstance = axios.create({
    baseURL: appConfig.bridgeApiBaseUrl,
    withCredentials: false
});

export const indexerInstance = axios.create({
    baseURL: appConfig.bridgeIndexerBaseUrl,
    withCredentials: false
});
