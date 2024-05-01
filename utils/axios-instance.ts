import { appConfig } from '@/config/default';
import axios from 'axios';
import 'dotenv/config'
axios.defaults.withCredentials = true;

export const apiInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BRIDGE_API_URL,
    headers: {"Access-Control-Allow-Origin": "*"},
    withCredentials: false
});

export const indexerInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BRIDGE_INDEXER_URL,
    headers: {"Access-Control-Allow-Origin": "*"},
    withCredentials: false
});
