import { NavLink } from 'react-router-dom';
import { LayoutList, Plus, BarChart3, LogOut } from 'lucide-react';

interface BottomNavProps {
    onSignOut: () => void;
    onAddClick: () => void;
}

const linkStyle = (isActive: boolean) => ({
    color: isActive ? 'var(--db-accent)' : 'var(--db-muted)',
});

export function BottomNav({ onSignOut, onAddClick }: BottomNavProps) {
    return (
        <nav
            className="fixed bottom-0 inset-x-0 lg:sticky lg:top-0 lg:bottom-auto flex items-center justify-around lg:justify-end lg:gap-6 px-4 py-2 lg:py-3 z-20"
            style={{ background: 'var(--db-surface)', borderTop: '1px solid var(--db-border)', borderBottom: '1px solid transparent' }}
        >
            <NavLink
                to="/dashboard"
                end
                className="flex flex-col lg:flex-row items-center gap-0.5 lg:gap-1.5 text-xs"
                style={({ isActive }) => linkStyle(isActive)}
            >
                <LayoutList size={20} />
                <span>Queue</span>
            </NavLink>

            <button
                onClick={onAddClick}
                className="flex flex-col items-center justify-center rounded-full -mt-6 lg:mt-0 lg:order-first w-14 h-14 lg:w-9 lg:h-9"
                style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                aria-label="Add role"
            >
                <Plus size={22} className="lg:hidden" />
                <Plus size={16} className="hidden lg:block" />
            </button>

            <NavLink
                to="/dashboard/metrics"
                className="flex flex-col lg:flex-row items-center gap-0.5 lg:gap-1.5 text-xs"
                style={({ isActive }) => linkStyle(isActive)}
            >
                <BarChart3 size={20} />
                <span>Metrics</span>
            </NavLink>

            <button
                onClick={onSignOut}
                className="hidden lg:flex flex-row items-center gap-1.5 text-xs"
                style={{ color: 'var(--db-muted)' }}
            >
                <LogOut size={16} />
                <span>Sign out on this device</span>
            </button>
        </nav>
    );
}
