import api from "./api";

/* ==========================================================
   REGMAP AI ENTERPRISE
   COPILOT API
========================================================== */

export async function querycopilot(query, session_id = "default") {
    const response = await api.post("/api/copilot/query", { query, session_id });
    return response.data;
}

export async function getHistory(session_id = "default") {
    const response = await api.get(`/api/copilot/history?session_id=${session_id}`);
    return response.data;
}

export async function clearHistory(session_id = "default") {
    const response = await api.post("/api/copilot/clear", { session_id });
    return response.data;
}
