
import axios from "axios";
import { getValidAirtableToken } from "../services/tokenManager.js";

const  airtableClient = axios.create({
  baseURL: "https://api.airtable.com/v0",
  timeout: 15000,
});
airtableClient.interceptors.request.use(
  async (config) => {
    const user = config.user;
    // 👆 tum ye user route se pass karoge

    if (!user) {
      throw new Error("User missing in Airtable request");
    }

    const token = await getValidAirtableToken(user);

    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default airtableClient;
