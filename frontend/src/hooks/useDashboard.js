import { useState, useEffect, useCallback } from 'react';
import { getDashboard, refreshDashboard } from '../api/dashboardApi';
import { useGlobalContext } from '../context/GlobalContext';

export function useDashboard() {
    const { lastUpdated } = useGlobalContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getDashboard();
            if (response.status === 'success') {
                setData(response.data);
            } else if (response.status === 'empty') {
                setData(null); // Explicitly null to show empty state
            } else {
                setError(response.message || 'Failed to fetch dashboard data');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while fetching dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard, lastUpdated]);

    const refresh = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await refreshDashboard();
            if (response.status === 'success') {
                setData(response.data);
            } else if (response.status === 'empty') {
                setData(null);
            } else {
                setError(response.message || 'Failed to refresh dashboard data');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while refreshing dashboard data');
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        loading,
        error,
        refresh
    };
}
