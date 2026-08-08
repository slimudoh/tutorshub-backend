import axios from "axios";

const digitalSambaAxiosInstance = axios.create({
  baseURL: process.env.DIGITAL_SAMBA_BASE_URL,
  headers: {
    Authorization: "Bearer " + process.env.DIGITAL_SAMBA_DEVELOPER_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

digitalSambaAxiosInstance.interceptors.request.use(
  function (config) {
    console.log("Making request to " + config.url);
    return config;
  },
  function (error) {
    return Promise.reject(
      new Error(error.response?.data?.message ?? error.message),
    );
  },
);

digitalSambaAxiosInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    console.log("error", error.response?.data?.message ?? error.message);
    return Promise.reject(
      new Error(error.response?.data?.message ?? error.message),
    );
  },
);

export default digitalSambaAxiosInstance;
