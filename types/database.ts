export interface Student {
  id: number;
  name: string;
  password?: string;
  school?: string | null;
  weekly_schedule?: Array<{ day: number; subject: string; time?: string }> | null;
  created_at?: string;
}

export interface Teacher {
  id: number;
  name: string;
  password?: string;
  created_at?: string;
}

export interface ClassLog {
  id: number;
  student_name: string;
  subject: string;
  class_date: string;
  duration: number;
  progress: string;
  homework?: string | null;
  note?: string | null;
  expense?: number | null;
  created_at?: string;
}

export interface Grade {
  id: number;
  student_name: string;
  subject: string;
  score: number;
  exam_date: string;
  unit: string;
  created_at?: string;
}

export interface PointLog {
  id: number;
  student_name: string;
  points: number;
  reason: string;
  created_at?: string;
}

export interface SubjectRate {
  id?: number;
  student_name: string;
  subject: string;
  rate: number;
  created_at?: string;
}

export interface Reward {
  id: number;
  title: string;
  points_required: number;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface StudentInventory {
  id: number;
  student_name: string;
  reward_title: string;
  status: 'unused' | 'used';
  used_at?: string | null;
  created_at?: string;
}

export interface CalendarEvent {
  id: number;
  event_date: string;
  end_date?: string | null;
  title: string;
  type: 'class' | 'exam' | 'cancellation' | 'activity';
  student_name: string;
  is_recurring?: boolean | null;
  recurring_pattern?: 'weekly' | null;
  recurring_end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  cancelled_dates?: string[] | null;
  created_at?: string;
  // Client-side computed properties
  isCancelled?: boolean;
}

export interface CoursePlan {
  id?: number;
  student_name: string;
  subject: string;
  calendar_event_id?: number | null;
  planned_date: string;
  planned_content: string;
  actual_content?: string | null;
  status?: 'pending' | 'on_track' | 'modified';
  created_at?: string;
}

