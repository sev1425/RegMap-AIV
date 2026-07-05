import api from "./api";

export async function getEvidenceStatus() {
    const response = await api.get("/api/evidence");
    return response.data;
}

export async function validateEvidence(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/evidence/validate", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
}
