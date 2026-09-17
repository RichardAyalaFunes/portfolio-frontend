/**
 * Backend API client for the job applications dashboard (/dashboard).
 *
 * Every call except login carries the device token as a Bearer header. On a
 * 401 the caller should send the user back to the gate (token missing/expired);
 * on a 423 the account is locked out for a while (see DashboardApiError.status).
 */

const host = import.meta.env.VITE_BACKEND_HOST || 'localhost:8000';
const BACKEND_URL = host.startsWith('http') ? host : `http://${host}`;
const BASE = `${BACKEND_URL}/api/dashboard`;

const TOKEN_KEY = 'dashboard_device_token';
const DEVICE_ID_KEY = 'dashboard_device_id';

export class DashboardApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = 'DashboardApiError';
    }
}

export function getDeviceId(): string {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

async function request<TResponse>(
    method: string,
    path: string,
    body?: unknown,
): Promise<TResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        const message = detail?.detail || response.statusText;
        if (response.status === 401) clearToken();
        throw new DashboardApiError(response.status, message);
    }
    if (response.status === 204) return undefined as TResponse;
    return (await response.json()) as TResponse;
}

// ── Types (mirrors backend/infrastructure/adapters/driver/rest/dashboard_controller.py) ──

/**
 * Outreach candidate for a role scoring >=80. Deliberately a loose shape, not a
 * strict union — see profile/job-search/dashboard/enrich.js for what the agent
 * actually writes. `outreach_stage` is the one field Richard owns from the UI;
 * everything else is written once by the enrichment step and left alone after.
 */
export interface RoleContact {
    id: string;
    name: string;
    title: string | null;
    linkedin_url: string | null;
    linkedin_slug: string | null;
    connection_degree: string | null;
    mutual_connections: number | null;
    category: string | null;
    priority_rank: number | null;
    reason: string | null;
    message_draft: string | null;
    outreach_stage: 'not_contacted' | 'sent' | 'replied' | string;
    outreach_stage_updated_at: string | null;
    source: string | null;
    found_at: string | null;
}

export interface ApplicationFormQuestion {
    question: string;
    required: boolean;
    field_type: string | null;
    classification: 'trivial' | 'substantive' | string;
    answer_bullets: string[] | null;
    answer_draft: string | null;
}

export interface RoleApplicationForm {
    apply_type: string | null;
    apply_url: string | null;
    checked_at: string | null;
    skipped_reason: string | null;
    questions: ApplicationFormQuestion[];
}

export interface JobApplication {
    id: string;
    legacy_id: string | null;
    identity_key: string;
    title: string;
    company: string;
    group: string | null;
    score: number | null;
    band: string | null;
    status: string;
    application_stage: string;
    location_text: string | null;
    work_mode: string | null;
    employment_type: string | null;
    salary_text: string | null;
    posted_date: string | null;
    posted_relative: string | null;
    eligibility_text: string | null;
    requirements_excerpt: string | null;
    why_apply: string | null;
    why_not: string | null;
    considerations: string | null;
    jd_url: string | null;
    source: string | null;
    run_date: string | null;
    first_seen: string | null;
    last_seen: string | null;
    live_state: string | null;
    work_remote_allowed: boolean | null;
    notes: string;
    postings: Array<{ id: string; url: string | null; source: string | null }>;
    contacts: RoleContact[];
    application_form: RoleApplicationForm | Record<string, never>;
    /** Other interest groups this role also serves; the primary lane is `group`. */
    secondary_lanes: string[];
    /** Every search line that surfaced this role (drives the agent's per-line yield). */
    discovery_queries: string[];
    /** Agent review warnings, e.g. location_unsure, big_corporate (see RoleTags). */
    tags: string[];
    /** Last time Richard changed status, stage or notes; the agent reads it as feedback. */
    reviewed_at: string | null;
    archived_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface MetricsResponse {
    total: number;
    status_counts: Record<string, number>;
    stage_counts: Record<string, number>;
    funnel_by_group: Record<string, Record<string, number>>;
    drop_reasons: Record<string, number>;
    portal_yield: Record<string, { total: number; approved: number }>;
}

export interface SearchRun {
    run_date: string;
    label: string | null;
    cards_surfaced: number | null;
    cards_opened: number | null;
    portals: string[];
    notes: string | null;
}

export interface ListFilters {
    status?: string;
    stage?: string;
    group?: string;
    source?: string;
    live?: string;
    run?: string;
    q?: string;
    sort?: string;
}

export const dashboardApi = {
    async login(password: string): Promise<{ token: string; expires_at: string }> {
        const result = await request<{ token: string; expires_at: string }>('POST', '/auth/login', {
            password,
            device_id: getDeviceId(),
        });
        storeToken(result.token);
        return result;
    },

    async validateStoredToken(): Promise<boolean> {
        if (!getStoredToken()) return false;
        try {
            await request('GET', '/auth/me');
            return true;
        } catch {
            return false;
        }
    },

    signOut(): void {
        clearToken();
    },

    async listApplications(filters: ListFilters = {}): Promise<JobApplication[]> {
        const params = new URLSearchParams(filters as Record<string, string>).toString();
        const result = await request<{ applications: JobApplication[] }>(
            'GET',
            `/applications${params ? `?${params}` : ''}`,
        );
        return result.applications;
    },

    async getApplication(id: string): Promise<JobApplication> {
        return request<JobApplication>('GET', `/applications/${id}`);
    },

    async createApplication(input: {
        title: string;
        company: string;
        group?: string;
        jd_url?: string;
        status?: string;
    }): Promise<JobApplication> {
        return request<JobApplication>('POST', '/applications', input);
    },

    async updateApplication(
        id: string,
        patch: { status?: string; stage?: string; notes?: string; jd_url?: string },
    ): Promise<JobApplication> {
        return request<JobApplication>('PATCH', `/applications/${id}`, patch);
    },

    async archiveApplication(id: string): Promise<void> {
        await request('DELETE', `/applications/${id}`);
    },

    async updateContactStage(
        applicationId: string,
        contactId: string,
        stage: string,
    ): Promise<JobApplication> {
        return request<JobApplication>('PATCH', `/applications/${applicationId}/contacts/${contactId}`, {
            stage,
        });
    },

    async getMetrics(scope: string = 'all'): Promise<MetricsResponse> {
        return request<MetricsResponse>('GET', `/metrics?scope=${encodeURIComponent(scope)}`);
    },

    async listRuns(): Promise<SearchRun[]> {
        const result = await request<{ runs: SearchRun[] }>('GET', '/runs');
        return result.runs;
    },
};
