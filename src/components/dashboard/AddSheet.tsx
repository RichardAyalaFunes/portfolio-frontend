import { useState, type FormEvent } from 'react';
import { dashboardApi, DashboardApiError } from '../../api/dashboardApi';

interface AddSheetProps {
    onClose: () => void;
    onAdded: () => void;
}

export function AddSheet({ onClose, onAdded }: AddSheetProps) {
    const [title, setTitle] = useState('');
    const [company, setCompany] = useState('');
    const [jdUrl, setJdUrl] = useState('');
    const [group, setGroup] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setSaving(true);
        try {
            await dashboardApi.createApplication({
                title,
                company,
                jd_url: jdUrl || undefined,
                group: group || undefined,
            });
            onAdded();
        } catch (err) {
            if (err instanceof DashboardApiError && err.status === 409) {
                setError('This role is already tracked.');
            } else {
                setError('Could not add this role.');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-30 flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <form
                onSubmit={handleSubmit}
                className="dashboard-sheet-enter relative w-full lg:max-w-md lg:rounded-2xl rounded-t-2xl p-5 flex flex-col gap-3"
                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
            >
                <h2 className="font-medium mb-1">Add a role</h2>

                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    required
                    autoFocus
                    className="px-3 py-2.5 rounded-xl text-sm"
                />
                <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company"
                    required
                    className="px-3 py-2.5 rounded-xl text-sm"
                />
                <input
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    placeholder="Posting URL (optional)"
                    type="url"
                    className="px-3 py-2.5 rounded-xl text-sm"
                />
                <select value={group} onChange={(e) => setGroup(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm">
                    <option value="">Group (optional)</option>
                    <option value="ai_engineer">ai_engineer</option>
                    <option value="founding_engineer">founding_engineer</option>
                    <option value="forward_deployed_engineer">forward_deployed_engineer</option>
                </select>

                {error && (
                    <p className="text-sm" style={{ color: 'var(--db-band-drop)' }}>
                        {error}
                    </p>
                )}

                <div className="flex gap-2 mt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl" style={{ background: 'var(--db-surface-2)' }}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !title || !company}
                        className="flex-1 py-2.5 rounded-xl font-medium disabled:opacity-50"
                        style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                    >
                        {saving ? 'Adding…' : 'Add'}
                    </button>
                </div>
            </form>
        </div>
    );
}
