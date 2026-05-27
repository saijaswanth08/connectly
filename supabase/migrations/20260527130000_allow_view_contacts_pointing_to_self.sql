-- Allow users to view contact records pointing to themselves so they can detect one-way connections and connect instantly
CREATE POLICY "Users can view contacts pointing to themselves" ON public.contacts
  FOR SELECT TO authenticated
  USING (target_user_id = auth.uid());
