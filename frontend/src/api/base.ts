export const BASE_URL = "https://kdhtht53-3000.inc1.devtunnels.ms/api";
export const FILE_BASE_URL = "https://kdhtht53-3000.inc1.devtunnels.ms";
export const BASE_URL_NO_API = "https://kdhtht53-3000.inc1.devtunnels.ms";

// export const BASE_URL = "https://2s01cq2n-3000.inc1.devtunnels.ms/api";
// export const FILE_BASE_URL = "https://2s01cq2n-3000.inc1.devtunnels.ms";
// export const BASE_URL_NO_API = "https://2s01cq2n-3000.inc1.devtunnels.ms";


// export const BASE_URL = "http://localhost:5001/api";
// export const FILE_BASE_URL = "http://localhost:5001";
// export const BASE_URL_NO_API = "http://localhost:5001";

export const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};
