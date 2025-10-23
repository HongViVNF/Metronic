export interface Activity {
    id?: string;
    name: string;
    description?: string | null;
    type: string;
    start_date?: string | null;
    end_date?: string | null;
    status: boolean;
    assignee: string;
  }
  