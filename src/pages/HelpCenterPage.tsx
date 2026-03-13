import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Calendar, Bell, Network, BookOpen, MessageSquare, Settings, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const helpTopics = [
  {
    icon: Users,
    title: "How to Add Contacts",
    description: "Learn how to add and organize your professional contacts in Connectly.",
    steps: [
      "Navigate to the Dashboard page.",
      "Click the 'Add Contact' button at the top.",
      "Fill in the contact's details like name, company, email, and phone.",
      "Assign tags and importance level for easy filtering.",
      "Click 'Save' to add the contact to your network.",
    ],
  },
  {
    icon: Calendar,
    title: "How to Schedule Meetings",
    description: "Set up meetings with your contacts and keep track of your schedule.",
    steps: [
      "Go to the Meetings page from the sidebar.",
      "Click 'Schedule Meeting' to create a new meeting.",
      "Select a contact, set the date, time, and location.",
      "Add any notes or agenda items.",
      "Save the meeting to your calendar.",
    ],
  },
  {
    icon: Bell,
    title: "How to Set Reminders",
    description: "Never miss a follow-up with automated reminders.",
    steps: [
      "Open the Reminders page from the sidebar.",
      "Click 'Create Reminder' to set a new one.",
      "Choose the contact and reminder type.",
      "Set the date and time for the reminder.",
      "You'll receive a notification when it's due.",
    ],
  },
  {
    icon: Network,
    title: "Managing Your Network",
    description: "Tips for organizing and growing your professional network effectively.",
    steps: [
      "Use tags to categorize contacts by industry or relationship.",
      "Set importance levels (VIP, High, Medium, Low) to prioritize.",
      "Add meeting notes to keep context for each relationship.",
      "Review your dashboard analytics to track engagement.",
      "Regularly update contact information to keep your network current.",
    ],
  },
  {
    icon: Settings,
    title: "Account & Profile Settings",
    description: "Manage your account details, profile photo, and preferences.",
    steps: [
      "Click your profile avatar in the top-right or sidebar.",
      "Select 'View Profile' to see your account details.",
      "Use 'Update Profile Photo' to change your avatar.",
      "Access Account Settings for password and security options.",
    ],
  },
  {
    icon: MessageSquare,
    title: "Getting Support",
    description: "How to reach out for help when you need it.",
    steps: [
      "Visit the Get Help page to send us a message.",
      "Use the Report a Bug page to log bugs or feature requests.",
      "Email us directly at support@connectly.com.",
    ],
  },
];

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = helpTopics.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back
        </button>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Help Center</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Find answers to common questions and learn how to get the most out of Connectly.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Topics */}
        <div className="grid gap-5 sm:grid-cols-2">
          {filtered.map((topic) => (
            <Card key={topic.title} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <topic.icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">{topic.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{topic.description}</p>
                <ol className="space-y-1.5 text-sm text-foreground/80 list-decimal list-inside">
                  {topic.steps.map((step, i) => (
                    <li key={i} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No topics found matching "{search}".</p>
          </div>
        )}
      </div>
    </div>
  );
}
