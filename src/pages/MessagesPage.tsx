import { useState, useRef, useEffect, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, ArrowLeft, MessageSquare, Plus, X } from "lucide-react";
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
  useEffect(() => {
    console.log("MessagesPage loaded");
  }, []);
  const isMobile = useIsMobile();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts();
  const { data: conversations = [] } = useConversations();
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(selectedConversationId);
  const sendMessage = useSendMessage();
  const getOrCreateConv = useGetOrCreateConversation();
  const { data: presenceRecords = [] } = useAllPresence();

  useRealtimeMessages(selectedConversationId);
  useRealtimeConversations();

  // Build a map of contact_id -> conversation
  const convByContact = useMemo(() => 
    new Map(conversations.map((c) => [c.contact_id, c])),
    [conversations]
  );

  // Filter contacts by search
  const filteredContacts = useMemo(() => 
    contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [contacts, search]
  );

  // Sort: contacts with conversations first (by last_message_at), then others
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      const convA = convByContact.get(a.id);
      const convB = convByContact.get(b.id);
      if (convA && convB) return new Date(convB.last_message_at).getTime() - new Date(convA.last_message_at).getTime();
      if (convA) return -1;
      if (convB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredContacts, convByContact]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSelectContact(contact: DbContact) {
    setSelectedContactId(contact.id);
    setShowPicker(false);
    setPickerSearch("");
    const conv = convByContact.get(contact.id);
    if (conv) {
      setSelectedConversationId(conv.id);
    } else {
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
          <div className="p-4">
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
            {isLoadingContacts ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedContacts.length === 0 ? (
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
                      {(() => {
                        const presence = getPresenceStatus(presenceRecords, contact.id);
                        return (
                          <div className={cn(
                            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                            presence.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                          )} />
                        );
                      })()}
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

          {/* New Message button + inline picker */}
          <div className="p-3 border-t border-border/50 relative">
            {showPicker && (
              <div className="absolute bottom-14 left-2 right-2 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden z-10">
                <div className="flex items-center gap-2 p-3 border-b border-border/40">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    placeholder="Search contacts..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  <button onClick={() => { setShowPicker(false); setPickerSearch(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {contacts
                    .filter((c) => c.name.toLowerCase().includes(pickerSearch.toLowerCase()))
                    .map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                          {contact.company && <p className="text-xs text-muted-foreground truncate">{contact.company}</p>}
                        </div>
                      </button>
                    ))}
                  {contacts.filter((c) => c.name.toLowerCase().includes(pickerSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No contacts found</p>
                  )}
                </div>
              </div>
            )}
            <Button
              onClick={() => setShowPicker((p) => !p)}
              variant="outline"
              className="w-full gap-2 text-sm"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </div>
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
                  {(() => {
                    const presence = getPresenceStatus(presenceRecords, selectedContact.id);
                    return presence.isOnline ? (
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Online
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        {formatLastSeen(presence.lastSeen)}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="space-y-4 py-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <Skeleton className="h-10 w-2/3 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                    <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Start a conversation</p>
                    <p className="text-xs mt-1 text-muted-foreground">Select a contact to view or send messages.</p>
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
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
