import api from "./api";

export async function getLatestAnalysis() {
    const response = await api.get("/api/analyze/latest");
    return response.data;
}

export async function deployTasks(taskIds) {
    const response = await api.post("/api/analyze/deploy-tasks", { task_ids: taskIds });
    return response.data;
}
