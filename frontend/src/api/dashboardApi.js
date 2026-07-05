import api from "./api";

/* ==========================================================
   REGMAP AI ENTERPRISE
   DASHBOARD API
========================================================== */

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

export async function getDashboard() {
    const response = await api.get("/api/dashboard");
    return response.data;
}

/*
|--------------------------------------------------------------------------
| Refresh Dashboard
|--------------------------------------------------------------------------
*/

export async function refreshDashboard() {
    // For now, this just fetches the dashboard again. 
    // In a real scenario, this might trigger a re-analysis on the backend.
    const response = await api.get("/api/dashboard");
    return response.data;
}