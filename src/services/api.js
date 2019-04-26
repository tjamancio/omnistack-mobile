import axios from 'axios';

const api = axios.create({
    baseURL: 'https://omnistack-backend102.herokuapp.com/'
});

export default api;