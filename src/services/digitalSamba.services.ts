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

  function (error: any) {
    const status = error?.response?.status;
    console.log({ status });

    if (error.response) {
      switch (status) {
        case 401:
          return Promise.reject(
            new Error(error.response?.data?.message ?? "Unauthorized"),
          );
        case 403:
          return Promise.reject(
            new Error(error.response?.data?.message ?? "Forbidden"),
          );
        case 404:
          return Promise.reject(
            new Error(error.response?.data?.message ?? "Not Found"),
          );
        case 429:
          return Promise.reject(
            new Error(
              error.response?.data?.message ??
                "Too many requests. Please try again later.",
            ),
          );
        case 500:
          return Promise.reject(
            new Error(error.response?.data?.message ?? "Internal Server Error"),
          );
        case 502:
          return Promise.reject(
            new Error(error.response?.data?.message ?? "Bad Gateway"),
          );
        case 503:
          return Promise.reject(
            new Error(error.response?.data?.message ?? "Service Unavailable"),
          );
        default:
          return Promise.reject(
            new Error(error.response?.data?.message ?? "An error occurred."),
          );
      }
    } else if (error.request) {
      if (error.code === "ECONNABORTED") {
        return Promise.reject(
          new Error(
            error.response?.data?.message ??
              "Request timeout. Please try again.",
          ),
        );
      } else if (error.code === "ERR_NETWORK") {
        return Promise.reject(
          new Error(
            error.response?.data?.message ??
              "Network error. Please check your connection.",
          ),
        );
      } else {
        return Promise.reject(
          new Error(
            error.response?.data?.message ??
              "No response from server. Please try again.",
          ),
        );
      }
    } else {
      return Promise.reject(
        new Error(error.response?.data?.message ?? "Failed to set up request."),
      );
    }
  },
);

export default digitalSambaAxiosInstance;
