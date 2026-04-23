import { supabase } from "@/lib/supabase";

// =======================
// INTERFACES
// =======================
export interface DbContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string;
  job_title: string;
  phone: string;

  priority: string;
  tags?: string[];
  linkedin: string;
  instagram: string;
  notes: string;
  created_at: string;
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

// =======================
// FETCH CONTACTS
// =======================
export const fetchContacts = async (): Promise<DbContact[]> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchContacts] Supabase error:", error);
    throw error;
  }

  return (data || []) as DbContact[];
};

// =======================
// CREATE CONTACT
// =======================
export const createContact = async (contact: any): Promise<DbContact> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const payload = {
    user_id: user.id,
    name: contact.name || "",
    email: contact.email || "",
    company: contact.company || "",
    notes: contact.notes || "",
    instagram: contact.instagram || "",
    linkedin: contact.linkedin || "",
    phone: contact.phone || "",
    job_title: contact.job_title || "",
    priority: contact.priority || "medium",
    tags: contact.tags || [],
  };

  const { data, error } = await supabase
    .from("contacts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[createContact] Supabase error:", error);
    throw error;
  }

  return data as DbContact;
};

// =======================
// UPDATE CONTACT
// =======================
export const updateContact = async (id: string, updates: any): Promise<DbContact> => {
  const payload = {
    name: updates.name ?? "",
    email: updates.email ?? "",
    company: updates.company ?? "",
    notes: updates.notes ?? "",
    instagram: updates.instagram ?? "",
    linkedin: updates.linkedin ?? "",
    phone: updates.phone ?? "",
    job_title: updates.job_title ?? "",
    priority: updates.priority ?? "medium",
    tags: updates.tags ?? [],
  };

  const { data, error } = await supabase
    .from("contacts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateContact] Supabase error:", error);
    throw error;
  }

  return data as DbContact;
};

// =======================
// DELETE CONTACT
// =======================
export const deleteContact = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// =======================
// SEARCH CONTACTS
// =======================
export async function searchContacts(query: string): Promise<DbContact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .or(`name.ilike.%${query}%,company.ilike.%${query}%,job_title.ilike.%${query}%,notes.ilike.%${query}%,email.ilike.%${query}%`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []) as DbContact[];
}

// =======================
// MEETINGS API
// =======================
export async function fetchMeetings(): Promise<DbMeeting[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[fetchMeetings] Auth error:", userError?.message);
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("user_id", user.id)
    .order("meeting_time", { ascending: false });

  if (error) {
    console.error("[fetchMeetings] Supabase error:", error);
    throw error;
  }
  return (data ?? []) as DbMeeting[];
}

export async function createMeeting(meeting: Omit<DbMeeting, "id" | "created_at">): Promise<DbMeeting> {
  const payload = {
    user_id: meeting.user_id,
    contact_id: meeting.contact_id || null,
    title: meeting.title ?? "",
    meeting_link: meeting.meeting_link ?? "",
    meeting_type: meeting.meeting_type ?? "other",
    location: meeting.location ?? "",
    meeting_time: meeting.meeting_time || null,
    notes: meeting.notes ?? "",
    status: meeting.status ?? "scheduled",
  };

  const { data, error } = await supabase
    .from("meetings")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbMeeting;
}

export async function updateMeeting(id: string, updates: Partial<DbMeeting>): Promise<DbMeeting> {
  const { data, error } = await supabase
    .from("meetings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbMeeting;
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw error;
}

// =======================
// REMINDERS API
// =======================
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
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[fetchReminders] Auth error:", userError?.message);
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.id)
    .order("reminder_date", { ascending: true });

  if (error) {
    console.error("[fetchReminders] Supabase error:", error);
    throw error;
  }
  return (data ?? []) as DbReminder[];
}

export async function createReminder(reminder: Omit<DbReminder, "id" | "created_at" | "updated_at">): Promise<DbReminder> {
  const payload = {
    user_id: reminder.user_id,
    contact_id: reminder.contact_id || null,
    title: reminder.title ?? "",
    message: reminder.message ?? "",
    reminder_date: reminder.reminder_date,
    completed: reminder.completed ?? false,
  };

  const { data, error } = await supabase
    .from("reminders")
    .insert(payload)
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

// =======================
// TIMELINE EVENTS API
// =======================
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

// =======================
// CONTACT CONNECTIONS API
// =======================
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

// =======================
// PROFILE API
// =======================
export const updateProfile = async (updates: {
  name?: string;
  email?: string;
  company?: string;
  job_title?: string;
  phone?: string;
  linkedin?: string;
  instagram?: string;
}) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Build explicit payload mapping frontend fields → actual DB column names
  // linkedin_url is the DB column name, not linkedin
  const payload = {
    name: updates.name ?? null,
    email: updates.email ?? null,
    company: updates.company ?? null,
    job_title: updates.job_title ?? null,
    phone: updates.phone ?? null,
    linkedin_url: updates.linkedin ?? null,  // DB column is linkedin_url
    instagram: updates.instagram ?? null,
  };

  console.log("FINAL PAYLOAD:", payload);

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("🔥 SUPABASE ERROR:", error.message, error.details, error.hint);
    throw error;
  }

  console.log("✅ UPDATE SUCCESS:", data);

  return data;
};
