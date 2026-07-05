import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { deployTasks } from '../api/analyzeApi';

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
    const [lastUpdated, setLastUpdated] = useState(Date.now());
    const [userRole, setUserRole] = useState(null); // 'Administrator', 'Compliance Officer', 'Auditor', 'Viewer'
    const [deployedTasks, setDeployedTasks] = useState(new Set());

    const triggerGlobalRefresh = useCallback(() => {
        setLastUpdated(Date.now());
    }, []);

    const login = useCallback((role) => {
        setUserRole(role);
    }, []);

    const logout = useCallback(() => {
        setUserRole(null);
    }, []);

    const deployTask = useCallback(async (id) => {
        try {
            await deployTasks([id]);
            setDeployedTasks(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
            triggerGlobalRefresh();
            toast.success(`Task ${id} resolved by AI`);
        } catch (error) {
            console.error("Failed to deploy task", error);
            toast.error("Failed to deploy task");
        }
    }, [triggerGlobalRefresh]);

    const deployTasksBulk = useCallback(async (ids) => {
        try {
            await deployTasks(ids);
            setDeployedTasks(prev => {
                const next = new Set(prev);
                ids.forEach(id => next.add(id));
                return next;
            });
            triggerGlobalRefresh();
            toast.success(`${ids.length} tasks deployed successfully`);
        } catch (error) {
            console.error("Failed to deploy tasks bulk", error);
            toast.error("Bulk deployment failed");
        }
    }, [triggerGlobalRefresh]);

    return (
        <GlobalContext.Provider
            value={{
                lastUpdated,
                triggerGlobalRefresh,
                userRole,
                login,
                logout,
                deployedTasks,
                deployTask,
                deployTasksBulk,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobalContext must be used within a GlobalProvider');
    }
    return context;
};
