import { useCallback, useEffect, useState } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { getSimulationBaseline, runSimulation } from "../api/simulatorApi";

export function useSimulator() {
    const { lastUpdated } = useGlobalContext();
    const [baseline, setBaseline] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSimulationBaseline();
            if (response.status === "success") {
                setBaseline(response);
            } else if (response.status === "empty") {
                setBaseline(null);
            } else {
                setError(response.message || "Unable to load simulator baseline.");
            }
        } catch (err) {
            setError(err.message || "Unable to load simulator baseline.");
        } finally {
            setLoading(false);
        }
    }, []);

    const simulate = useCallback(async (overrides) => {
        try {
            setSimulating(true);
            setError(null);
            const response = await runSimulation(overrides);
            if (response.status === "success") {
                setResult(response);
            } else {
                setError(response.message || "Unable to run simulation.");
            }
        } catch (err) {
            setError(err.message || "Unable to run simulation.");
        } finally {
            setSimulating(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh, lastUpdated]);

    return { baseline, result, loading, simulating, error, refresh, simulate };
}
