import { useCallback, useEffect, useState } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { compareAnalyses, getConflictAnalyses, getInternalConflicts } from "../api/conflictApi";

export function useConflict() {
    const { lastUpdated } = useGlobalContext();
    const [analyses, setAnalyses] = useState([]);
    const [internal, setInternal] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [analysisResponse, internalResponse] = await Promise.all([
                getConflictAnalyses(),
                getInternalConflicts()
            ]);
            setAnalyses(analysisResponse.analyses || []);
            setInternal(internalResponse);
        } catch (err) {
            setError(err.message || "Unable to load conflict data.");
        } finally {
            setLoading(false);
        }
    }, []);

    const compare = useCallback(async (idA, idB) => {
        if (!idA || !idB || idA === idB) return;
        try {
            setComparing(true);
            setError(null);
            const response = await compareAnalyses(idA, idB);
            if (response.status === "success") {
                setComparison(response);
            } else {
                setError(response.message || "Unable to compare analyses.");
            }
        } catch (err) {
            setError(err.message || "Unable to compare analyses.");
        } finally {
            setComparing(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh, lastUpdated]);

    return { analyses, internal, comparison, loading, comparing, error, refresh, compare };
}
