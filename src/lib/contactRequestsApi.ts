import { supabase } from "@/lib/supabase";

export interface DbContactRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  from_profile?: { id: string; name: string; email: string; company: string; job_title: string; phone: string; avatar_url: string | null };
  to_profile?: { id: string; name: string; email: string; company: string; job_title: string; phone: string; avatar_url: string | null };
}

export async function lookupProfileByEmail(email: string) {
  if (!email) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, company, job_title, linkedin')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();
  return data as { id: string; name: string; email: string; avatar_url: string | null; company: string; job_title: string; linkedin: string | null } | null;
}

export async function fetchIncomingContactRequests(): Promise<DbContactRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*, from_profile:profiles!from_user_id(id, name, email, company, job_title, phone, avatar_url)')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbContactRequest[];
}

export async function fetchOutgoingAcceptedRequests(): Promise<DbContactRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*, to_profile:profiles!to_user_id(id, name, email, company, job_title, phone, avatar_url)')
    .eq('from_user_id', user.id)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbContactRequest[];
}

export async function sendContactRequest(toUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: existing } = await supabase
    .from('contact_requests')
    .select('id, status')
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId)
    .maybeSingle();
  if (existing?.status === 'pending') throw new Error('Request already sent to this user.');
  if (existing?.status === 'accepted') throw new Error('You are already connected with this user.');
  const { error } = await supabase
    .from('contact_requests')
    .insert({ from_user_id: user.id, to_user_id: toUserId });
  if (error) throw error;
}

export async function acceptContactRequest(requestId: string, fromUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: p } = await supabase.from('profiles').select('*').eq('id', fromUserId).maybeSingle();
  if (p) {
    // Check if contact already exists
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', p.email || '')
      .limit(1);

    console.log("DEBUG: Existing contacts check for email", p.email, "=>", existingContacts);

    if (!existingContacts || existingContacts.length === 0) {
      console.log("DEBUG: Attempting to insert new contact for", p.email);
      const payload = {
        user_id: user.id,
        name: p.name || 'Unknown',
        email: p.email || '',
        phone: p.phone || '',
        company: p.company || '',
        job_title: p.job_title || '',
        linkedin: p.linkedin || '',
        instagram: p.instagram || '',
        notes: 'Connected via Connectly',
        priority: 'medium',
        avatar_url: p.avatar_url,
        target_user_id: p.id,
        tags: [],
      };
      console.log("DEBUG: Insert payload:", payload);
      
      const { data: insertedData, error: insertError } = await supabase.from('contacts').insert(payload).select();
      
      console.log("DEBUG: Insert result:", { insertedData, insertError });
      
      if (insertError) {
        console.error("Failed to insert contact on accept:", insertError);
        throw insertError;
      }
    } else {
      console.log("DEBUG: Skipped insert because contact already exists!");
    }
  }
  const { error } = await supabase
    .from('contact_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);
  if (error) throw error;
}

export async function declineContactRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('contact_requests')
    .update({ status: 'declined' })
    .eq('id', requestId);
  if (error) throw error;
}

// Called by requester after their request is accepted — creates contact on their side
export async function addContactFromAcceptedRequest(requestId: string, toUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: p } = await supabase.from('profiles').select('*').eq('id', toUserId).maybeSingle();
  if (p) {
    // Check if contact already exists
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', p.email || '')
      .limit(1);

    if (!existingContacts || existingContacts.length === 0) {
      const { error: insertError } = await supabase.from('contacts').insert({
        user_id: user.id,
        name: p.name || 'Unknown',
        email: p.email || '',
        phone: p.phone || '',
        company: p.company || '',
        job_title: p.job_title || '',
        linkedin: p.linkedin || '',
        instagram: p.instagram || '',
        notes: 'Connected via Connectly',
        priority: 'medium',
        avatar_url: p.avatar_url,
        target_user_id: p.id,
        tags: [],
      });

      if (insertError) {
        console.error("Failed to insert contact from accepted request:", insertError);
        throw new Error(`Database error saving contact: ${insertError.message}`);
      }
    }
  }
  // Repurpose "declined" as "processed" to hide from outgoing accepted list
  const { data, error } = await supabase
    .from('contact_requests')
    .update({ status: 'declined' })
    .eq('id', requestId)
    .select();

  if (error) throw error;
  
  if (!data || data.length === 0) {
    throw new Error("Failed to dismiss notification. Make sure you have permission to update your requests.");
  }
}
