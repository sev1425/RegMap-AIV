import api from "./api";

export async function getKnowledgeGraph() {
    const response = await api.get("/api/graph");
    return response.data;
}
