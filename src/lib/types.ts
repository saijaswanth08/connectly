export type ImportanceLevel = "vip" | "high" | "medium" | "low";
export type ContactTag = "investor" | "client" | "mentor" | "partner" | "recruiter" | "friend";
export type MeetingType = "conference" | "call" | "lunch" | "networking" | "other";
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  photoUrl?: string;
  priority: ImportanceLevel;
  created_at: string;
  notes: string;
  user_id?: string;
  linkedin?: string;
  instagram?: string;
  tags?: string[];
}

export interface Meeting {
  id: string;
  contactId: string;
  eventName: string;
  location: string;
  dateMet: string;
  meetingType: MeetingType;
  topic: string;
  opportunityNotes: string;
}

export interface Reminder {
  id: string;
  contactId: string;
  date: string;
  message: string;
  completed: boolean;
}

export interface TimelineEntry {
  id: string;
  contactId: string;
  date: string;
  description: string;
  type: "meeting" | "call" | "note" | "reminder";
}
