import { useState, useRef, useEffect } from "react";
import { useContacts } from "@/hooks/useContacts";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useGetOrCreateConversation,
  useRealtimeMessages,
  useRealtimeConversations,
} from "@/hooks/useMessages";
import { useAllPresence, getPresenceStatus, formatLastSeen } from "@/hooks/usePresence";
import { DbContact } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, ArrowLeft, MessageSquare } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

export default function MessagesPage() {
  const isMobile = useIsMobile();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [] } = useContacts();
  const { data: conversations = [] } = useConversations();
  const { data: messages = [] } = useMessages(selectedConversationId);
  const sendMessage = useSendMessage();
  const getOrCreateConv = useGetOrCreateConversation();
  const { data: presenceRecords = [] } = useAllPresence();

  useRealtimeMessages(selectedConversationId);
  useRealtimeConversations();

  // Build a map of contact_id -> conversation
  const convByContact = new Map(conversations.map((c) => [c.contact_id, c]));

  // Filter contacts by search
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: contacts with conversations first (by last_message_at), then others
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const convA = convByContact.get(a.id);
    const convB = convByContact.get(b.id);
    if (convA && convB) return new Date(convB.last_message_at).getTime() - new Date(convA.last_message_at).getTime();
    if (convA) return -1;
    if (convB) return 1;
    return a.name.localeCompare(b.name);
  });

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSelectContact(contact: DbContact) {
    setSelectedContactId(contact.id);
    const conv = convByContact.get(contact.id);
    if (conv) {
      setSelectedConversationId(conv.id);
    } else {
      // Create conversation on first message, not on select
      setSelectedConversationId(null);
    }
  }

  async function handleSend() {
    if (!messageText.trim() || !selectedContactId) return;

    let convId = selectedConversationId;
    if (!convId) {
      const conv = await getOrCreateConv.mutateAsync(selectedContactId);
      convId = conv.id;
      setSelectedConversationId(conv.id);
    }

    await sendMessage.mutateAsync({
      conversationId: convId,
      content: messageText.trim(),
    });
    setMessageText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showContactList = !isMobile || !selectedContactId;
  const showChat = !isMobile || !!selectedContactId;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel - Contact List */}
      {showContactList && (
        <div className={cn(
          "flex flex-col border-r border-border/50 bg-card",
          isMobile ? "w-full" : "w-80 shrink-0"
        )}>
          <div className="p-4 border-b border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {sortedContacts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No contacts found</p>
              </div>
            ) : (
              sortedContacts.map((contact) => {
                const conv = convByContact.get(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left",
                      selectedContactId === contact.id && "bg-accent"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Simulated online status for demo */}
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {contact.name}
                        </span>
                        {conv && (
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {formatMessageTime(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv?.last_message || contact.company || "Start a conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </ScrollArea>
        </div>
      )}

      {/* Right Panel - Chat Window */}
      {showChat && (
        <div className="flex-1 flex flex-col bg-background">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedContactId(null);
                      setSelectedConversationId(null);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {getInitials(selectedContact.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {selectedContact.name}
                  </h3>
                  <p className="text-[11px] text-green-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                    Online
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isUser = msg.sender_type === "user";
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex", isUser ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                              isUser
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            )}
                          >
                            <p className="text-4xl font-bold leading-tight whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={cn(
                                "text-[10px] mt-1",
                                isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border/50 bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    size="icon"
                    className="shrink-0 rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1" />

          )}
        </div>
      )}
    </div>
  );
}
