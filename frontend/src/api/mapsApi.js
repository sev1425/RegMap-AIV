import axios from "axios";
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const fetchMAPs = () => axios.get(`${API}/maps/`).then(r => r.data);
export const updateMAPStatus = (id, status) =>
  axios.patch(`${API}/maps/${id}/status`, { status }).then(r => r.data);
export const fetchMAPsByDept = (dept) =>
  axios.get(`${API}/maps/department/${dept}`).then(r => r.data);
