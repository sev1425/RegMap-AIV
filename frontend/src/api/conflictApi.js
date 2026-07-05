import api from "./api";

export async function getInternalConflicts() {
    const response = await api.get("/api/conflict/internal");
    return response.data;
}

export async function getConflictAnalyses() {
    const response = await api.get("/api/conflict/analyses");
    return response.data;
}

export async function compareAnalyses(idA, idB) {
    const response = await api.post("/api/conflict/compare", {
        id_a: idA,
        id_b: idB
    });
    return response.data;
}
