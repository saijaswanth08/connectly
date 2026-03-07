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
