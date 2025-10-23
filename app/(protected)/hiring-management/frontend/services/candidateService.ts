import { toast } from 'sonner';

const API_BASE_URL = '/hiring-management/api/candidate';

interface UpdateNoteParams {
  id: string;
  note?: string;
}

interface GetListParams {
  jobId?: string;
}

export const candidateService = {
  async updateNote({ id, note }: UpdateNoteParams) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/note`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật ghi chú');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi khi cập nhật ghi chú:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể tải ứng viên');
      }

      const data = await response.json();
      return data.data; // vì backend trả về { data: candidate }
    } catch (error) {
      console.error('Lỗi khi tải ứng viên:', error);
      throw error;
    }
  },

  async getList({ jobId }: GetListParams = {}) {
    try {
      const url = new URL(API_BASE_URL, window.location.origin);
      if (jobId) {
        url.searchParams.set('job_id', jobId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể tải danh sách ứng viên');
      }

      const data = await response.json();
      return data.data; // backend trả về { success: true, data: candidates[] }
    } catch (error) {
      console.error('Lỗi khi tải danh sách ứng viên:', error);
      throw error;
    }
  },

  async updateFitScore({ id, fit_score }: { id: string; fit_score: number }) {
    try {
      const userId = typeof window !== "undefined" ? 
        JSON.parse(localStorage.getItem("ai.platform") || '{}')?.state?.user?.id || '' : '';

      const response = await fetch(API_BASE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          fit_score,
          updatedById: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật điểm phù hợp');
      }

      return response.json();
    } catch (error) {
      console.error('Lỗi khi cập nhật điểm phù hợp:', error);
      throw error;
    }
  },
};