import axios from "axios";

export default axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
})