import api from "./api";

export async function getTimeline() {
    const response = await api.get("/api/timeline");
    return response.data;
}
