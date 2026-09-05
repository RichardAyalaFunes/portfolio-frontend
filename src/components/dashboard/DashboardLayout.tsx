import { useEffect, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { Gate } from './Gate';
import { Queue } from './Queue';
import { ApplicationDetail } from './ApplicationDetail';
import { Metrics } from './Metrics';
import { BottomNav } from './BottomNav';
import { AddSheet } from './AddSheet';
import '../../styles/dashboard.css';

type AuthState = 'checking' | 'authed' | 'unauthed';

/** Keeps /dashboard out of search results -- restores whatever robots tag
 * (or absence of one) existed before, on unmount. */
function useNoIndex() {
    useEffect(() => {
        const existing = document.querySelector('meta[name="robots"]');
        const previousContent = existing?.getAttribute('content') ?? null;
        const meta = existing ?? document.createElement('meta');
        meta.setAttribute('name', 'robots');
        meta.setAttribute('content', 'noindex');
        if (!existing) document.head.appendChild(meta);

        return () => {
            if (previousContent !== null) {
                meta.setAttribute('content', previousContent);
            } else {
                meta.remove();
            }
        };
    }, []);
}

export default function DashboardLayout() {
    useNoIndex();
    const [authState, setAuthState] = useState<AuthState>('checking');
    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        dashboardApi.validateStoredToken().then((ok) => setAuthState(ok ? 'authed' : 'unauthed'));
    }, []);

    const handleGateSuccess = useCallback(() => setAuthState('authed'), []);
    const handleSignOut = useCallback(() => {
        dashboardApi.signOut();
        setAuthState('unauthed');
    }, []);
    const handleAdded = useCallback(() => {
        setAddSheetOpen(false);
        setRefreshToken((n) => n + 1);
    }, []);

    if (authState === 'checking') {
        return (
            <div className="dashboard-scope min-h-screen flex items-center justify-center">
                <div className="dashboard-skeleton w-40 h-8" />
            </div>
        );
    }

    if (authState === 'unauthed') {
        return (
            <div className="dashboard-scope min-h-screen">
                <Gate onSuccess={handleGateSuccess} />
            </div>
        );
    }

    return (
        <div className="dashboard-scope h-screen flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto pb-20 lg:pb-0" style={{ background: 'var(--db-bg)' }}>
                <Routes>
                    <Route path="/" element={<Queue refreshToken={refreshToken} />}>
                        <Route path=":applicationId" element={<ApplicationDetail />} />
                    </Route>
                    <Route path="/metrics" element={<Metrics />} />
                </Routes>
            </div>
            <BottomNav onSignOut={handleSignOut} onAddClick={() => setAddSheetOpen(true)} />
            {addSheetOpen && (
                <AddSheet onClose={() => setAddSheetOpen(false)} onAdded={handleAdded} />
            )}
        </div>
    );
}
