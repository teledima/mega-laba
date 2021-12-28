import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://192.168.1.44:8000',
    withCredentials: true,
    headers: {'Content-Type': 'multipart/form-data'},
});
export default instance;
