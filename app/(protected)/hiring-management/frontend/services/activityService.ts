// Activity Service - Xử lý tất cả các API liên quan đến hoạt động (activities, interviews, exams, email)
const API_BASE_URL = '/hiring-management/api';

// Interfaces
export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  totalQuestions?: number;
  questionCount?: number;
  code?: string;
  idLessonFile?: string | null;
  settings?: {
    solanThi?: number;
    solanvipham?: number;
    quydinhDiemThi?: number;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  content: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface InterviewData {
  link: string;
  idNV: string;
  createdById: string;
  type: 'interview' | 'test';
  ngayPhongVan?: string;
  linkInterview?: string;
  location?: string;
  candidate_activity_id?: string | null;
}

export interface EmailData {
  link: string;
  email: string;
  hoTen: string;
  startDate?: string;
  endDate?: string;
  examInfo?: {
    title: string;
    code?: string;
    duration?: number;
    questionCount?: number;
    solanThi?: number;
    solanvipham?: number;
    quydinhDiemThi?: number;
  };
  type: string;
  template_id?: string;
  templateId?: string; // for backend compatibility
}

// Utility function to get user ID from localStorage
const getUserId = (): string => {
  const state = localStorage.getItem("ai.platform");
  return state ? JSON.parse(state)?.state?.user?.id : "";
};

// Utility function to get headers with user ID
const getHeaders = (contentType: string = 'application/json') => ({
  'Content-Type': contentType,
  'X-AI-Platform-UserId': getUserId(),
});

// Exam related API calls
export const examService = {
  async getExams(): Promise<Exam[]> {
    try {
      const response = await fetch("/examhr/api/exams");
      if (!response.ok) {
        throw new Error("Failed to fetch exams");
      }
      const data = await response.json();
      return data.exams || [];
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
    }
  },
};

// Email template related API calls
export const emailTemplateService = {
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await fetch('/hiring-management/api/emailtemplate');
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch email templates');
      }
      return result.data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }
  },
};

// User related API calls
export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
};

// Interview related API calls
export const interviewService = {
  async createInterview(data: InterviewData): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/interview`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create interview: ${errorText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating interview:', error);
      throw error;
    }
  },

  async updateInterview(data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/interview`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          ...data,
          updatedById: getUserId(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update interview: ${errorText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  },

  async createMultipleInterviews(data: {
    link: string;
    candidateIds: string[];
    type: 'interview' | 'test';
    ngayPhongVan?: string;
    linkInterview?: string;
    location?: string;
    candidateActivities: { candidate_id: string; candidate_activity_id: string | null }[];
  }): Promise<any[]> {
    try {
      const interviews = await Promise.all(
        data.candidateIds.map(async (idNV, index) => {
          const candidateActivityId = data.candidateActivities.find(ca => ca.candidate_id === idNV)?.candidate_activity_id || null;

          const interviewData: InterviewData = {
            link: data.link,
            idNV,
            createdById: getUserId(),
            type: data.type,
            ngayPhongVan: data.ngayPhongVan,
            linkInterview: data.linkInterview,
            location: data.location,
            candidate_activity_id: candidateActivityId,
          };

          return await this.createInterview(interviewData);
        })
      );

      return interviews;
    } catch (error) {
      console.error('Error creating multiple interviews:', error);
      throw error;
    }
  },
};

// Activity related API calls
export const activityServiceMain = {
  async updateActivity(activityId: string, data: { name?: string; description?: string }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          id: activityId,
          ...data,
          updated_by: getUserId(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update activity: ${errorText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  async deleteActivity(activityId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities`, {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({ id: activityId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete activity: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  async updateCandidateActivityStatus(taskId: string, candidateId: string, status: 'in_progress' | 'completed' | 'cancelled'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities-candidate?task_id=${taskId}&candidate_id=${candidateId}&status=${status}`, {
        method: "PATCH",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating candidate activity status:', error);
      throw error;
    }
  },

  async updateActivityResult(candidate_activity_id: string, result: 'pending' | 'pass' | 'fail'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities-candidate/result`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          candidate_activity_id,
          result,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      return responseData.data;
    } catch (error) {
      console.error('Error updating activity result:', error);
      throw error;
    }
  },

  async updateNoteResult(candidate_activity_id: string, noteresult: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities-candidate/note`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          candidate_activity_id,
          noteresult,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating note result:', error);
      throw error;
    }
  },
};
export const emailService = {
  async sendTemplateEmail(data: EmailData): Promise<void> {
    try {
      console.log('sendEmail payload', data);

      const response = await fetch("/api/sendtemplateEmail", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...data,
          templateId: data.template_id, // Map to backend expected field
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("sendEmail error response:", response.status, text);
        throw new Error(`Failed to send email to ${data.email}`);
      }
    } catch (error) {
      console.error('Error sending template email:', error);
      throw error;
    }
  },
};

// Activity Service - Main export
export const activityService = {
  exam: examService,
  emailTemplate: emailTemplateService,
  user: userService,
  interview: interviewService,
  email: emailService,
  activity: activityServiceMain,
};

// Default export for convenience
export default activityService;
