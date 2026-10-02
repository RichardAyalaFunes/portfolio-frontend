import type { JobApplication } from '../../api/dashboardApi';

/**
 * What the queue hands to the detail screen through the router outlet, so a
 * save in the detail pane updates the list on the left straight away.
 */
export interface QueueOutletContext {
    /** The detail screen saved a change: put the server's copy of the role into the list. */
    onApplicationChanged: (updated: JobApplication) => void;
    /** The role was archived: take it out of the list. */
    onApplicationRemoved: (id: string) => void;
}
