import { useCallback, useEffect, useState } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { getEvidenceStatus, validateEvidence } from "../api/evidenceApi";

export function useEvidence() {
    const { lastUpdated } = useGlobalContext();
    const [data, setData] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getEvidenceStatus();
            if (response.status === "success") {
                setData(response.data);
            } else if (response.status === "empty") {
                setData(null);
            } else {
                setError(response.message || "Unable to load evidence data.");
            }
        } catch (err) {
            setError(err.message || "Unable to load evidence data.");
        } finally {
            setLoading(false);
        }
    }, []);

    const validate = useCallback(async (file) => {
        if (!file) return;
        try {
            setValidating(true);
            setError(null);
            const response = await validateEvidence(file);
            if (response.status === "success") {
                setResult(response.data);
            } else {
                setError(response.message || "Unable to validate evidence.");
            }
        } catch (err) {
            setError(err.message || "Unable to validate evidence.");
        } finally {
            setValidating(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh, lastUpdated]);

    return { data, result, loading, validating, error, refresh, validate };
}
