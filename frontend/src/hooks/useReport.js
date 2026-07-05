import { useCallback, useEffect, useState } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { getReport } from "../api/reportApi";

export function useReport() {
    const { lastUpdated } = useGlobalContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getReport();
            if (response.status === "success") {
                setData(response.data);
            } else if (response.status === "empty") {
                setData(null);
            } else {
                setError(response.message || "Unable to load report.");
            }
        } catch (err) {
            setError(err.message || "Unable to load report.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh, lastUpdated]);

    return { data, loading, error, refresh };
}
