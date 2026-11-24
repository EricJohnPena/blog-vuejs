import axios from "axios";


const api = axios.create({
    baseURL: "https://blog-api-qxt5.onrender.com/",
});


api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        // Add the Authorization header with the token
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Export the instance of axios so that we can use it in our components
export default api;
