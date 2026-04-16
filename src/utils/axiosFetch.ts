import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASEURL,
});

axiosInstance.interceptors.request.use(
  function (config) {
    console.log("Making request to " + config.url);
    return config;
  },
  function (error) {
    return Promise.reject(error.response?.data?.message);
  }
);

axiosInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    console.log("error", error.response?.data?.message);
    return Promise.reject(error.response?.data?.message);
  }
);

export default axiosInstance;
