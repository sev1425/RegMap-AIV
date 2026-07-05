import { useCallback, useEffect, useState } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { getLatestAnalysis } from "../api/analyzeApi";

export function useAnalysis() {
    const { lastUpdated } = useGlobalContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const offline = typeof navigator !== "undefined" && !navigator.onLine;

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getLatestAnalysis();
            if (response.status === "success") {
                setData(response.data);
            } else if (response.status === "empty") {
                setData(null);
            } else {
                setError(response.message || "Unable to load analysis.");
            }
        } catch (err) {
            setError(err.message || "Unable to load analysis.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh, lastUpdated]);

    return { data, loading, error, offline, refresh };
}
