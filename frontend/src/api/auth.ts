// src/api/auth.ts
import { BASE_URL } from "./base";

export const registerUser = async (payload: {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  amount: number;
}) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { message, token }
};
