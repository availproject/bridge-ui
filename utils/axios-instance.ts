import { appConfig } from '@/config/default';
import axios from 'axios';
// import 'dotenv/config'
axios.defaults.withCredentials = true;

export const apiInstance = axios.create({
    baseURL: appConfig.bridgeApiBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});

export const indexerInstance = axios.create({
    baseURL: appConfig.bridgeIndexerBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});
