import { Contact, Meeting, Reminder, TimelineEntry } from "./types";

export const mockContacts: Contact[] = [
  {
    id: "1", name: "Sarah Chen", email: "sarah@venturecap.co", phone: "+1 415-555-0101",
    company: "Venture Capital Partners", jobTitle: "Managing Partner", tags: ["investor"],
    importance: "vip", dateAdded: "2026-01-15", notes: "Interested in AI/ML startups. Prefer morning meetings.",
  },
  {
    id: "2", name: "Marcus Williams", email: "marcus@techforge.io", phone: "+1 628-555-0202",
    company: "TechForge", jobTitle: "CEO & Co-Founder", tags: ["partner", "client"],
    importance: "high", dateAdded: "2026-01-22", notes: "Building enterprise SaaS. Looking for strategic partnerships.",
  },
  {
    id: "3", name: "Priya Patel", email: "priya@growthlab.com", phone: "+1 510-555-0303",
    company: "GrowthLab", jobTitle: "Head of Operations", tags: ["mentor"],
    importance: "high", dateAdded: "2026-02-03", notes: "Expert in scaling operations. Great advisor.",
  },
  {
    id: "4", name: "James Rodriguez", email: "james@blockbridge.fi", phone: "+1 212-555-0404",
    company: "BlockBridge Finance", jobTitle: "Investment Director", tags: ["investor", "partner"],
    importance: "vip", dateAdded: "2026-02-10", notes: "Fintech focused. $50M fund for Series A/B.",
  },
  {
    id: "5", name: "Emily Nakamura", email: "emily@designstudio.co", phone: "+1 323-555-0505",
    company: "Design Studio Co", jobTitle: "Creative Director", tags: ["client"],
    importance: "medium", dateAdded: "2026-02-18", notes: "Potential design partner for brand refresh.",
  },
  {
    id: "6", name: "David Kim", email: "david@talentsync.io", phone: "+1 650-555-0606",
    company: "TalentSync", jobTitle: "Senior Recruiter", tags: ["recruiter"],
    importance: "medium", dateAdded: "2026-02-25", notes: "Specializes in C-suite placements for tech startups.",
  },
  {
    id: "7", name: "Olivia Thompson", email: "olivia@nexusai.com", phone: "+1 408-555-0707",
    company: "Nexus AI", jobTitle: "CTO", tags: ["partner", "friend"],
    importance: "high", dateAdded: "2026-03-01", notes: "Building AI infrastructure. Potential integration partner.",
  },
  {
    id: "8", name: "Alex Morgan", email: "alex@greenpeak.vc", phone: "+1 415-555-0808",
    company: "GreenPeak Ventures", jobTitle: "Analyst", tags: ["investor"],
    importance: "low", dateAdded: "2026-03-04", notes: "Junior analyst. Good for deal flow introductions.",
  },
];

export const mockMeetings: Meeting[] = [
  { id: "m1", contactId: "1", eventName: "TechCrunch Disrupt", location: "San Francisco, CA", dateMet: "2026-01-15", meetingType: "conference", topic: "AI startup investment landscape", opportunityNotes: "Interested in our Series A. Follow up in Q2." },
  { id: "m2", contactId: "2", eventName: "SaaS North", location: "Virtual", dateMet: "2026-01-22", meetingType: "call", topic: "Enterprise integration partnership", opportunityNotes: "Wants API integration within 60 days." },
  { id: "m3", contactId: "4", eventName: "Fintech Summit", location: "New York, NY", dateMet: "2026-02-10", meetingType: "conference", topic: "Series B funding discussion", opportunityNotes: "Strong interest. Needs financial projections." },
  { id: "m4", contactId: "3", eventName: "Mentor Lunch", location: "Palo Alto, CA", dateMet: "2026-02-03", meetingType: "lunch", topic: "Scaling team from 20 to 50", opportunityNotes: "Offered to intro us to her HR network." },
  { id: "m5", contactId: "7", eventName: "AI Builders Meetup", location: "San Jose, CA", dateMet: "2026-03-01", meetingType: "networking", topic: "AI model deployment strategies", opportunityNotes: "Potential co-development of inference pipeline." },
];

export const mockReminders: Reminder[] = [
  { id: "r1", contactId: "1", date: "2026-03-10", message: "Send Series A deck to Sarah", completed: false },
  { id: "r2", contactId: "2", date: "2026-03-08", message: "Follow up on API integration timeline", completed: false },
  { id: "r3", contactId: "4", date: "2026-03-15", message: "Share financial projections with James", completed: false },
  { id: "r4", contactId: "3", date: "2026-03-12", message: "Schedule next mentorship session with Priya", completed: false },
  { id: "r5", contactId: "7", date: "2026-03-20", message: "Review Olivia's technical proposal", completed: false },
];

export const mockTimeline: TimelineEntry[] = [
  { id: "t1", contactId: "1", date: "2026-01-15", description: "Met at TechCrunch Disrupt", type: "meeting" },
  { id: "t2", contactId: "1", date: "2026-01-25", description: "Follow-up call about investment thesis", type: "call" },
  { id: "t3", contactId: "1", date: "2026-02-14", description: "Sent preliminary pitch deck", type: "note" },
  { id: "t4", contactId: "2", date: "2026-01-22", description: "Initial call about partnership", type: "call" },
  { id: "t5", contactId: "2", date: "2026-02-05", description: "Shared API documentation", type: "note" },
  { id: "t6", contactId: "4", date: "2026-02-10", description: "Met at Fintech Summit", type: "meeting" },
  { id: "t7", contactId: "4", date: "2026-02-20", description: "Sent term sheet draft", type: "note" },
];

export const monthlyContactsData = [
  { month: "Oct", contacts: 5 },
  { month: "Nov", contacts: 8 },
  { month: "Dec", contacts: 6 },
  { month: "Jan", contacts: 12 },
  { month: "Feb", contacts: 15 },
  { month: "Mar", contacts: 8 },
];

export const meetingTypesData = [
  { name: "Conference", value: 35, fill: "hsl(var(--chart-1))" },
  { name: "Calls", value: 28, fill: "hsl(var(--chart-2))" },
  { name: "Lunch", value: 18, fill: "hsl(var(--chart-4))" },
  { name: "Networking", value: 19, fill: "hsl(var(--chart-3))" },
];

export const tagDistribution = [
  { tag: "Investor", count: 3 },
  { tag: "Client", count: 2 },
  { tag: "Partner", count: 3 },
  { tag: "Mentor", count: 1 },
  { tag: "Recruiter", count: 1 },
  { tag: "Friend", count: 1 },
];
