import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** When this changes (the route, for instance) a screen that failed gets another try. */
    resetKey?: string;
}

interface State {
    failed: boolean;
}

/**
 * A screen that throws while rendering shows a message and keeps the bottom navigation
 * alive, instead of unmounting the whole dashboard into a blank page.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
    state: State = { failed: false };

    static getDerivedStateFromError(): State {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('A dashboard screen failed to render', error, info.componentStack);
    }

    componentDidUpdate(previous: Props) {
        if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
    }

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div role="alert" className="p-6 max-w-md mx-auto text-center flex flex-col gap-2">
                <p className="font-medium">This screen hit a problem.</p>
                <p className="text-sm" style={{ color: 'var(--db-muted)' }}>
                    The rest of the dashboard still works: use the tabs below, or try this screen again.
                </p>
                <button
                    type="button"
                    onClick={() => this.setState({ failed: false })}
                    className="self-center px-4 py-2 rounded-xl text-sm font-medium mt-1"
                    style={{ background: 'var(--db-surface-2)' }}
                >
                    Try again
                </button>
            </div>
        );
    }
}
