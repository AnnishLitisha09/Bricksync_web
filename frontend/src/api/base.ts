// export const BASE_URL = "https://2s01cq2n-3000.inc1.devtunnels.ms/api";
// export const FILE_BASE_URL = "https://2s01cq2n-3000.inc1.devtunnels.ms";
// export const BASE_URL_NO_API = "https://2s01cq2n-3000.inc1.devtunnels.ms";
// // export const VITE_API_URL = "https://2s01cq2n-3000.inc1.devtunnels.ms";


export const BASE_URL = "http://localhost:3000/api";
export const FILE_BASE_URL = "http://localhost:3000";
export const BASE_URL_NO_API = "http://localhost:3000";

export const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};
