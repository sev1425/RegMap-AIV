import { useCallback, useEffect, useState } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { getKnowledgeGraph } from "../api/graphApi";

export function useGraph() {
    const { lastUpdated } = useGlobalContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const offline = typeof navigator !== "undefined" && !navigator.onLine;

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getKnowledgeGraph();
            if (response.status === "success") {
                setData(response.data);
            } else if (response.status === "empty") {
                setData(null);
            } else {
                setError(response.message || "Unable to load knowledge graph.");
            }
        } catch (err) {
            setError(err.message || "Unable to load knowledge graph.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh, lastUpdated]);

    return { data, loading, error, offline, refresh };
}
