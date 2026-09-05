import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { dashboardApi, DashboardApiError } from '../../api/dashboardApi';

interface GateProps {
    onSuccess: () => void;
}

export function Gate({ onSuccess }: GateProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await dashboardApi.login(password);
            onSuccess();
        } catch (err) {
            if (err instanceof DashboardApiError && err.status === 423) {
                setError('Too many attempts. Locked for up to 24 hours.');
            } else if (err instanceof DashboardApiError && err.status === 401) {
                setError('Wrong password.');
            } else {
                setError('Could not reach the server. Try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-5"
                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
            >
                <div className="flex flex-col items-center gap-2 mb-2">
                    <Lock size={28} style={{ color: 'var(--db-accent)' }} />
                    <h1 className="text-lg font-medium">Dashboard</h1>
                </div>

                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoFocus
                        className="w-full px-4 py-3 pr-11 rounded-xl outline-none"
                        style={{ fontSize: '16px' }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--db-muted)', minHeight: 'auto' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {error && (
                    <p className="text-sm" style={{ color: 'var(--db-band-drop)' }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting || !password}
                    className="w-full py-3 rounded-xl font-medium disabled:opacity-50"
                    style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                >
                    {submitting ? 'Checking…' : 'Enter'}
                </button>
            </form>
        </div>
    );
}
