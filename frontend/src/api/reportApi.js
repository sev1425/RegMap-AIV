import api from "./api";

export async function getReport() {
    const response = await api.get("/api/reports");
    return response.data;
}

export function getReportDownloadUrl(format = "pdf") {
    return `http://127.0.0.1:5000/api/reports/download?format=${format}`;
}
