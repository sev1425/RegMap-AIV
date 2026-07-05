import { useCallback, useEffect, useState } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { getTimeline } from "../api/timelineApi";

export function useTimeline() {
    const { lastUpdated } = useGlobalContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const offline = typeof navigator !== "undefined" && !navigator.onLine;

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTimeline();
            if (response.status === "success") {
                setData(response.data);
            } else if (response.status === "empty") {
                setData(null);
            } else {
                setError(response.message || "Unable to load timeline.");
            }
        } catch (err) {
            setError(err.message || "Unable to load timeline.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh, lastUpdated]);

    return { data, loading, error, offline, refresh };
}
