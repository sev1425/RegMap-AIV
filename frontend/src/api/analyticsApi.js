import api from "./api";

export async function getAnalytics() {
    const response = await api.get("/api/analytics");
    return response.data;
}
