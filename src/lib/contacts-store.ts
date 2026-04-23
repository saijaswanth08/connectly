import { create } from "zustand";
import {
  DbContact,
  fetchContacts as fetchContactsFromApi,
  createContact,
  updateContact as updateContactInApi,
  deleteContact as deleteContactFromApi,
} from "./api";
import { Meeting } from "./types";

interface ContactsStore {
  contacts: DbContact[];
  meetings: Meeting[];
  searchQuery: string;
  fetchContacts: (userId: string) => Promise<void>;
  addContact: (contact: Omit<DbContact, "id" | "created_at">) => Promise<void>;
  updateContact: (id: string, updates: Partial<DbContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  filteredContacts: () => DbContact[];
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
  contacts: [],
  meetings: [],
  searchQuery: "",

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchContacts: async (userId: string) => {
    try {
      if (!userId) throw new Error("User ID missing");
      const data = await fetchContactsFromApi();
      set({ contacts: data });
    } catch (e) {
      console.error("[store] fetchContacts error:", e);
      throw e;
    }
  },

  addContact: async (contact) => {
    try {
      if (!contact.user_id) throw new Error("user_id missing");
      const data = await createContact(contact);
      set((s) => ({ contacts: [data, ...s.contacts] }));
    } catch (e) {
      console.error("[store] addContact error:", e);
      throw e;
    }
  },

  updateContact: async (id, updates) => {
    try {
      const data = await updateContactInApi(id, updates);
      set((s) => ({
        contacts: s.contacts.map((c) => (c.id === id ? data : c)),
      }));
    } catch (e) {
      console.error("[store] updateContact error:", e);
      throw e;
    }
  },

  deleteContact: async (id) => {
    try {
      await deleteContactFromApi(id);
      set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
    } catch (e) {
      console.error("[store] deleteContact error:", e);
      throw e;
    }
  },

  filteredContacts: () => {
    const { contacts, searchQuery } = get();
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  },
}));
