import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
axios.defaults.withCredentials = true;

export const axiosInstance = axios.create({
    baseURL: "http://localhost:8000",

    withCredentials: false
});