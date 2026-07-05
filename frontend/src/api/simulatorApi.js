import api from "./api";

export async function getSimulationBaseline() {
    const response = await api.get("/api/simulator/baseline");
    return response.data;
}

export async function runSimulation(overrides) {
    const response = await api.post("/api/simulator/simulate", overrides);
    return response.data;
}
