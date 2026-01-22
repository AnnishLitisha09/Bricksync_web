import { BASE_URL, getAuthHeader } from "./base";

/* 🔹 Get profile */
export const getProfile = async () => {
  const res = await fetch(`${BASE_URL}/user/profile`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch profile");
  return data;
};

/* 🔹 Update profile image */
export const updateProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}/user/profile/image`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");
};

/* 🔹 Update Aadhaar image */
export const updateAadhaarImage = async (file: File) => {
  const formData = new FormData();
  formData.append("aadhar", file);

  const res = await fetch(`${BASE_URL}/user/profile/aadhar`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Aadhaar upload failed");
};

/* 🔹 Update Driving Licence Front */
export const updateDrivingLicenceImage = async (file: File) => {
  const formData = new FormData();
  formData.append("drivingLicence", file);

  const res = await fetch(`${BASE_URL}/user/profile/driving-licence`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Driving licence upload failed");
};

/* 🔹 Update Driving Licence Back + Validity */
export const updateDrivingLicenceBack = async (
  file: File,
  validityDate: string
) => {
  const formData = new FormData();
  formData.append("drivingLicenceBack", file);
  formData.append("validityDate", validityDate);

  const res = await fetch(`${BASE_URL}/user/profile/driving-licence/back`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Driving licence back upload failed");
};

/* 🔹 Get all users */
export const getAllUsers = async () => {
  const res = await fetch(`${BASE_URL}/user`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch users");
  return data;
};

/* 🔹 Delete user */
export const deleteUser = async (userid: number) => {
  const res = await fetch(`${BASE_URL}/user/${userid}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!res.ok) throw new Error("Delete failed");
};
