import { supabase } from "@/integrations/supabase/client";

export interface DbContact {
  id: string;
  user_id: string;
  name: string;
  company: string;
  job_title: string;
  phone: string;
  email: string;
  linkedin_url: string;
  meeting_location: string;
  meeting_date: string | null;
  notes: string;
  tags: string[];
  importance: string;
  created_at: string;
  updated_at: string;
}

export interface DbMeeting {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  meeting_link: string;
  meeting_type: string;
  location: string;
  meeting_time: string | null;
  notes: string;
  status: string;
  created_at: string;
}

export async function fetchContacts(): Promise<DbContact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbContact[];
}

export async function createContact(contact: Omit<DbContact, "id" | "created_at" | "updated_at">): Promise<DbContact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert(contact)
    .select()
    .single();
  if (error) throw error;
  return data as DbContact;
}

export async function updateContact(id: string, updates: Partial<DbContact>): Promise<DbContact> {
  const { data, error } = await supabase
    .from("contacts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbContact;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function searchContacts(query: string): Promise<DbContact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .or(`name.ilike.%${query}%,company.ilike.%${query}%,job_title.ilike.%${query}%,notes.ilike.%${query}%,email.ilike.%${query}%`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbContact[];
}

export async function fetchMeetings(): Promise<DbMeeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .order("meeting_time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbMeeting[];
}

export async function createMeeting(meeting: Omit<DbMeeting, "id" | "created_at">): Promise<DbMeeting> {
  const { data, error } = await supabase
    .from("meetings")
    .insert(meeting)
    .select()
    .single();
  if (error) throw error;
  return data as DbMeeting;
}

// Reminders API
export interface DbReminder {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  message: string;
  reminder_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchReminders(): Promise<DbReminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .order("reminder_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbReminder[];
}

export async function createReminder(reminder: Omit<DbReminder, "id" | "created_at" | "updated_at">): Promise<DbReminder> {
  const { data, error } = await supabase
    .from("reminders")
    .insert(reminder)
    .select()
    .single();
  if (error) throw error;
  return data as DbReminder;
}

export async function updateReminder(id: string, updates: Partial<DbReminder>): Promise<DbReminder> {
  const { data, error } = await supabase
    .from("reminders")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbReminder;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}

// Timeline Events API
export interface DbTimelineEvent {
  id: string;
  user_id: string;
  contact_id: string;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
  created_at: string;
}

export async function fetchTimelineEvents(contactId?: string): Promise<DbTimelineEvent[]> {
  let query = supabase.from("timeline_events").select("*").order("event_date", { ascending: false });
  if (contactId) query = query.eq("contact_id", contactId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbTimelineEvent[];
}

export async function createTimelineEvent(event: Omit<DbTimelineEvent, "id" | "created_at">): Promise<DbTimelineEvent> {
  const { data, error } = await supabase.from("timeline_events").insert(event).select().single();
  if (error) throw error;
  return data as DbTimelineEvent;
}

export async function deleteTimelineEvent(id: string): Promise<void> {
  const { error } = await supabase.from("timeline_events").delete().eq("id", id);
  if (error) throw error;
}

// Contact Connections API
export interface DbContactConnection {
  id: string;
  user_id: string;
  contact_id_a: string;
  contact_id_b: string;
  relationship_type: string;
  created_at: string;
}

export async function fetchContactConnections(): Promise<DbContactConnection[]> {
  const { data, error } = await supabase.from("contact_connections").select("*");
  if (error) throw error;
  return (data ?? []) as DbContactConnection[];
}

export async function createContactConnection(conn: Omit<DbContactConnection, "id" | "created_at">): Promise<DbContactConnection> {
  const { data, error } = await supabase.from("contact_connections").insert(conn).select().single();
  if (error) throw error;
  return data as DbContactConnection;
}

export async function deleteContactConnection(id: string): Promise<void> {
  const { error } = await supabase.from("contact_connections").delete().eq("id", id);
  if (error) throw error;
}
