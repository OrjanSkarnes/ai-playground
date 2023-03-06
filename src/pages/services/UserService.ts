// Connect to endpoint to get and set user data
import { User } from "../models/user";
import axios from 'axios';

export async function registerUser(user: User) {
  const response = await axios.post(`/api/user/register`, { user });

  // Store the JWT in local storage
  localStorage.setItem("jwt", response.data.token);
  localStorage.setItem("userId", response.data.userId)
  // Use the JWT to authenticate subsequent requests
  axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

  return response.status;
}

export async function loginUser(user: { username?: string, email?: string, password: string }) {
  console.log(user)
  return await axios.post(`/api/user/login`, { user })
  .then(response => {
    // Store the JWT in local storage
    localStorage.setItem("jwt", response.data.token);
    localStorage.setItem("userId", response.data.userId)
    // Use the JWT to authenticate subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    return response;
  })
  .catch(error => {
    return error;
  });
}
