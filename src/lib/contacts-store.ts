import { create } from "zustand";
import { Contact, Reminder, TimelineEntry, Meeting } from "./types";
import { mockContacts, mockMeetings, mockReminders, mockTimeline } from "./mock-data";

interface ContactsStore {
  contacts: Contact[];
  meetings: Meeting[];
  reminders: Reminder[];
  timeline: TimelineEntry[];
  searchQuery: string;
  selectedTags: string[];
  setSearchQuery: (q: string) => void;
  setSelectedTags: (tags: string[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  toggleReminder: (id: string) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  filteredContacts: () => Contact[];
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
  contacts: mockContacts,
  meetings: mockMeetings,
  reminders: mockReminders,
  timeline: mockTimeline,
  searchQuery: "",
  selectedTags: [],
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  addContact: (contact) => set((s) => ({ contacts: [contact, ...s.contacts] })),
  updateContact: (id, updates) => set((s) => ({
    contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),
  deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
  addReminder: (reminder) => set((s) => ({ reminders: [reminder, ...s.reminders] })),
  toggleReminder: (id) => set((s) => ({
    reminders: s.reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
  })),
  addTimelineEntry: (entry) => set((s) => ({ timeline: [entry, ...s.timeline] })),
  filteredContacts: () => {
    const { contacts, searchQuery, selectedTags } = get();
    return contacts.filter((c) => {
      const matchesSearch = !searchQuery || 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        c.tags.some((t) => selectedTags.includes(t));
      return matchesSearch && matchesTags;
    });
  },
}));
