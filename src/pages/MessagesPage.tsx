import { useState, useRef, useEffect, useMemo } from "react";
import { useContacts } from "@/hooks/useContacts";
import { useRealtimeContacts } from "@/hooks/useRealtimeContacts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useGetOrCreateConversation,
  useRealtimeMessages,
  useRealtimeConversations,
  useClearConversation,
  useDeleteMessage,
  useEditMessage,
} from "@/hooks/useMessages";
import { usePresence, isUserOnline } from "@/hooks/usePresence";
import { DbContact } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Send,
  ArrowLeft,
  MessageSquare,
  Plus,
  X,
  MoreVertical,
  ShieldAlert,
  Ban,
  Trash2,
  FileText,
  Download,
  Copy,
  Reply,
  Forward,
  Edit3,
  Music,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

function formatLastMessagePreview(content: string | null) {
  if (!content) return "";
  if (content.startsWith("> 📝 Replying to:")) {
    const parts = content.split("\n\n");
    if (parts.length > 1) {
      return parts.slice(1).join("\n\n");
    }
  }
  if (content.startsWith("blob:") || content.includes("chat-attachments") || content.includes("/storage/v1/object/public/")) {
    const isImg = content.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?|$)/i) !== null || content.startsWith("blob:");
    const isVid = content.match(/\.(mp4|mov|webm|ogg|avi|mkv|m4v)(\?|$)/i) !== null;
    const isAud = content.match(/\.(mp3|wav|m4a|ogg|aac|flac|opus)(\?|$)/i) !== null;
    if (isImg) {
      return "📷 Photo";
    } else if (isVid) {
      return "🎥 Video";
    } else if (isAud) {
      return "🎵 Audio";
    } else {
      return "📎 File";
    }
  }
  return content;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { onlineUsers } = usePresence();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const contactIdParam = searchParams.get("contactId");

  useEffect(() => {
    console.log("MessagesPage loaded");
  }, []);

  const isMobileQuery = useIsMobile();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024 || isMobileQuery);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileQuery]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  // Premium feature states
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts();
  const { data: conversations = [] } = useConversations();

  // Helper to determine if a contact is online, fallback to matching sibling contacts
  const getContactOnlineStatus = (c: DbContact) => {
    if (!c) return false;
    if (c.target_user_id && c.target_user_id !== user?.id) {
      if (onlineUsers.has(c.target_user_id)) return true;
    }
    const name = c.name ? c.name.toLowerCase().trim() : "";
    const email = c.email ? c.email.toLowerCase().trim() : "";
    
    return contacts.some((other) => {
      if (other.target_user_id === user?.id) return false;
      if (!other.target_user_id) return false;
      
      const nameMatch = name && other.name && other.name.toLowerCase().trim() === name;
      const emailMatch = email && other.email && other.email.toLowerCase().trim() === email;
      
      return (nameMatch || emailMatch) && onlineUsers.has(other.target_user_id);
    });
  };

  // Build a map of contact_id -> conversation
  const convByContact = useMemo(() => 
    new Map(conversations.map((c) => [c.contact_id, c])),
    [conversations]
  );

  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId);
  }, [contacts, selectedContactId]);

  // Find all sibling contacts that represent the same person
  const siblingContacts = useMemo(() => {
    if (!selectedContact) return [];

    const selectedIsSelf =
      selectedContact.target_user_id === user?.id ||
      (user?.email &&
        selectedContact.email &&
        selectedContact.email.toLowerCase().trim() === user.email.toLowerCase().trim());

    const targetId = selectedContact.target_user_id;
    const email = selectedContact.email ? selectedContact.email.toLowerCase().trim() : "";
    const name = selectedContact.name ? selectedContact.name.toLowerCase().trim() : "";

    return contacts.filter((c) => {
      const cIsSelf =
        c.target_user_id === user?.id ||
        (user?.email &&
          c.email &&
          c.email.toLowerCase().trim() === user.email.toLowerCase().trim());

      if (selectedIsSelf !== cIsSelf) return false;
      if (targetId && c.target_user_id === targetId) return true;
      
      const cEmail = c.email ? c.email.toLowerCase().trim() : "";
      if (email && cEmail === email) return true;
      
      const cName = c.name ? c.name.toLowerCase().trim() : "";
      if (name && cName === name) return true;
      
      return false;
    });
  }, [selectedContact, contacts, user]);

  // Find all conversation IDs for these sibling contacts
  const siblingConversationIds = useMemo(() => {
    return siblingContacts
      .map((c) => convByContact.get(c.id)?.id)
      .filter((id): id is string => !!id);
  }, [siblingContacts, convByContact]);

  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(
    siblingConversationIds.length > 0 ? siblingConversationIds : selectedConversationId
  );
  
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const clearChat = useClearConversation();
  const deleteMessage = useDeleteMessage();
  const getOrCreateConv = useGetOrCreateConversation();
  const [deletedMessageIds, setDeletedMessageIds] = useState<string[]>([]);

  async function handleDeleteMessage(messageId: string) {
    if (!selectedConversationId) return;

    // Optimistically hide the message in the UI immediately
    setDeletedMessageIds((prev) => [...prev, messageId]);
    setOptimisticMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      await deleteMessage.mutateAsync({
        messageId,
        conversationId: selectedConversationId,
      });
      toast({
        title: "Message unsent 🗑️",
      });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      setDeletedMessageIds((prev) => prev.filter((id) => id !== messageId));
      toast({
        title: "Failed to delete message",
        description: error.message || "An unknown database error occurred.",
        variant: "destructive",
      });
    }
  }

  async function handleSaveEdit(messageId: string) {
    if (!editingText.trim()) return;
    try {
      await editMessage.mutateAsync({
        messageId,
        content: editingText.trim(),
      });
      toast({
        title: "Message edited ✅",
      });
      setEditingMessageId(null);
      setEditingText("");
    } catch (error: any) {
      console.error("Error editing message:", error);
      toast({
        title: "Failed to edit message",
        description: error.message || "An unknown database error occurred.",
        variant: "destructive",
      });
    }
  }

  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  // Merge database messages with unsynced optimistic local messages
  const allMessages = useMemo(() => {
    const realContentSet = new Set(messages.map((m) => m.content));
    const filteredOptimistic = optimisticMessages.filter((om) => !realContentSet.has(om.content));
    const combined = [...messages, ...filteredOptimistic];
    return combined.filter((m) => !deletedMessageIds.includes(m.id));
  }, [messages, optimisticMessages, deletedMessageIds]);

  useRealtimeMessages(siblingConversationIds.length > 0 ? siblingConversationIds : selectedConversationId);
  useRealtimeConversations();
  useRealtimeContacts(user?.id);

  // Synchronize URL search params with active selectedContactId
  useEffect(() => {
    if (contactIdParam && contacts.length > 0) {
      const matchedContact = contacts.find((c) => c.id === contactIdParam);
      if (matchedContact) {
        setSelectedContactId(matchedContact.id);
        const conv = convByContact.get(matchedContact.id);
        if (conv) {
          setSelectedConversationId(conv.id);
        } else {
          setSelectedConversationId(null);
        }
      }
    }
  }, [contactIdParam, contacts, convByContact]);

  // Filter: show active conversations by default, or all matching contacts if searching
  const filteredContacts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (term) {
      return contacts.filter((c) => c.name.toLowerCase().includes(term));
    }
    return contacts.filter((c) => convByContact.has(c.id));
  }, [contacts, search, convByContact]);

  // Sort: contacts with conversations first (by last_message_at), then others
  const sortedContacts = useMemo(() => {
    const sorted = [...filteredContacts].sort((a, b) => {
      const convA = convByContact.get(a.id);
      const convB = convByContact.get(b.id);
      if (convA && convB) return new Date(convB.last_message_at).getTime() - new Date(convA.last_message_at).getTime();
      if (convA) return -1;
      if (convB) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    const seenTargetIds = new Set<string>();
    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();

    return sorted.filter((c) => {
      const targetId = c.target_user_id;
      const email = c.email ? c.email.toLowerCase().trim() : "";
      const name = c.name ? c.name.toLowerCase().trim() : "";

      const isSelf =
        targetId === user?.id ||
        (user?.email && email && email === user.email.toLowerCase().trim());

      const hasSeen =
        !isSelf &&
        ((targetId && seenTargetIds.has(targetId)) ||
          (email && seenEmails.has(email)) ||
          (name && seenNames.has(name)));

      if (hasSeen) {
        return false;
      }

      if (targetId) seenTargetIds.add(targetId);
      if (email) seenEmails.add(email);
      if (name) seenNames.add(name);

      return true;
    });
  }, [filteredContacts, convByContact, user]);

  const uniqueContactsAlphabetical = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const seenTargetIds = new Set<string>();
    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();

    return sorted.filter((c) => {
      const targetId = c.target_user_id;
      const email = c.email ? c.email.toLowerCase().trim() : "";
      const name = c.name ? c.name.toLowerCase().trim() : "";

      const isSelf =
        targetId === user?.id ||
        (user?.email && email && email === user.email.toLowerCase().trim());

      const hasSeen =
        !isSelf &&
        ((targetId && seenTargetIds.has(targetId)) ||
          (email && seenEmails.has(email)) ||
          (name && seenNames.has(name)));

      if (hasSeen) {
        return false;
      }

      if (targetId) seenTargetIds.add(targetId);
      if (email) seenEmails.add(email);
      if (name) seenNames.add(name);

      return true;
    });
  }, [contacts, user]);

  const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior,
          block: "end",
        });
      }
    }, 80);
  };

  useEffect(() => {
    if (selectedConversationId && !isLoadingMessages) {
      scrollToBottom("auto");
    }
  }, [selectedConversationId, isLoadingMessages]);

  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [allMessages.length]);

  async function handleSelectContact(contact: DbContact) {
    if (forwardingMessage) {
      // Forward mode execution
      try {
        let conv = convByContact.get(contact.id);
        let convId = conv?.id;
        if (!convId) {
          const newConv = await getOrCreateConv.mutateAsync(contact.id);
          convId = newConv.id;
        }
        await sendMessage.mutateAsync({
          conversationId: convId,
          content: forwardingMessage.content,
        });
        toast({
          title: "Message forwarded! 🚀",
          description: `Successfully sent to ${contact.name}`,
        });
        setSelectedContactId(contact.id);
        setSelectedConversationId(convId);
        setSearchParams({ contactId: contact.id });
      } catch (e: any) {
        toast({
          title: "Failed to forward message",
          description: e.message || "An error occurred.",
          variant: "destructive",
        });
      } finally {
        setForwardingMessage(null);
        setShowPicker(false);
      }
      return;
    }

    setSearchParams({ contactId: contact.id });
    setShowPicker(false);
    setPickerSearch("");
  }

  async function handleSend() {
    if (!messageText.trim()) {
      toast({
        title: "Validation error ⚠️",
        description: "Cannot send an empty message.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedContactId) return;

    let textToSend = messageText.trim();
    if (replyingTo) {
      // Inline reply serialization block
      const cleanReplied = replyingTo.content.startsWith("> 📝 Replying to:")
        ? replyingTo.content.split("\n\n").slice(1).join("\n\n")
        : replyingTo.content;
      textToSend = `> 📝 Replying to: ${cleanReplied}\n\n${textToSend}`;
    }

    setMessageText("");
    setReplyingTo(null);

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: selectedConversationId || "temp",
      user_id: user?.id || "user",
      sender_type: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    setOptimisticMessages((prev) => [...prev, optimisticMsg]);

    try {
      let convId = selectedConversationId;
      if (!convId) {
        const conv = await getOrCreateConv.mutateAsync(selectedContactId);
        convId = conv.id;
        setSelectedConversationId(conv.id);
      }

      await sendMessage.mutateAsync({
        conversationId: convId,
        content: textToSend,
      });
    } catch (error: any) {
      console.error("Message send error:", error);
      setMessageText(messageText); // restore original text
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast({
        title: "Failed to send message",
        description: error.message || "An unknown database error occurred.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      }, 1500);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function isImageUrl(url: string) {
    try {
      if (url.startsWith("blob:") && !url.includes("video") && !url.includes("audio")) return true;
      if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
      return url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?|$)/i) !== null;
    } catch {
      return false;
    }
  }

  function isVideoUrl(url: string) {
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
      return url.match(/\.(mp4|mov|webm|ogg|ogv|avi|mkv|m4v|3gp|3gpp)(\?|$)/i) !== null;
    } catch {
      return false;
    }
  }

  function isAudioUrl(url: string) {
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
      return url.match(/\.(mp3|wav|m4a|ogg|aac|flac|opus)(\?|$)/i) !== null;
    } catch {
      return false;
    }
  }

  function isAttachmentUrl(url: string) {
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
      const isStorage = url.includes("chat-attachments") || url.includes("/storage/v1/object/public/");
      return isStorage && !isImageUrl(url) && !isVideoUrl(url) && !isAudioUrl(url);
    } catch {
      return false;
    }
  }

  function getFileNameFromUrl(url: string) {
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split("/");
      const lastPart = parts[parts.length - 1];
      return lastPart.replace(/^\d+-/, "");
    } catch {
      return "Attachment";
    }
  }

  async function downloadFile(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
      window.open(url, "_blank");
    }
  }

  function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            0.75
          );
        };
      };
      reader.onerror = () => resolve(file);
    });
  }

  function getExtensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/bmp": ".bmp",
      "video/mp4": ".mp4",
      "video/quicktime": ".mov",
      "video/webm": ".webm",
      "video/ogg": ".ogv",
      "video/x-msvideo": ".avi",
      "video/x-matroska": ".mkv",
      "video/x-m4v": ".m4v",
      "video/3gpp": ".3gp",
      "audio/mp3": ".mp3",
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/x-wav": ".wav",
      "audio/ogg": ".ogg",
      "audio/aac": ".aac",
      "audio/x-m4a": ".m4a",
      "audio/m4a": ".m4a",
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "text/plain": ".txt",
    };
    return map[mimeType] ?? "";
  }

  function normalizeFileName(file: File): string {
    const ext = getExtensionFromMime(file.type);
    const baseName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
    if (ext && baseName.toLowerCase().endsWith(ext)) return baseName;
    if (ext) return baseName.replace(/\.[^.]+$/, "") + ext;
    return baseName;
  }

  function readFileAsBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () =>
        reject(
          new Error(
            "Could not read this file. If selecting from Google Drive, please download it to your device first, then try again."
          )
        );
      reader.readAsArrayBuffer(file);
    });
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedContactId) return;

    setUploadingAttachment(true);

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    const localPreviewUrl = isImage ? URL.createObjectURL(file) : "";
    const tempId = `optimistic-${Date.now()}`;

    if (isImage) {
      setOptimisticMessages((prev) => [
        ...prev,
        {
          id: tempId,
          conversation_id: selectedConversationId || "temp",
          user_id: user?.id || "user",
          sender_type: "user",
          content: localPreviewUrl,
          created_at: new Date().toISOString(),
          isOptimistic: true,
        },
      ]);
    } else {
      toast({
        title: isVideo ? "Uploading video..." : isAudio ? "Uploading audio..." : "Uploading file...",
        description: `Sending ${file.name} to ${selectedContact?.name.split(" ")[0]}`,
      });
    }

    try {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose a file under 50MB.",
          variant: "destructive",
        });
        setUploadingAttachment(false);
        if (attachmentInputRef.current) attachmentInputRef.current.value = "";
        return;
      }

      const buffer = await readFileAsBuffer(isImage ? await compressImage(file) : file);
      const safeFileName = normalizeFileName(file);
      const uploadBlob = new Blob([buffer], { type: file.type });

      let convId = selectedConversationId;
      if (!convId) {
        const conv = await getOrCreateConv.mutateAsync(selectedContactId);
        convId = conv.id;
        setSelectedConversationId(conv.id);
      }

      const filePath = `${user?.id || "anon"}/chat-attachments/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, uploadBlob, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      await sendMessage.mutateAsync({
        conversationId: convId,
        content: publicUrl,
      });

      if (!isImage) {
        toast({
          title: isVideo ? "Video sent! 🎥" : isAudio ? "Audio sent! 🎵" : "File sent! 📎",
        });
      }
    } catch (err: any) {
      console.error("Attachment upload error:", err);
      if (isImage) {
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
      const isNetworkError =
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("network");
      toast({
        title: "Failed to send attachment",
        description: isNetworkError
          ? "Network error. If selecting from Google Drive, please download the file to your device first, then try again."
          : err.message || "Unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      setTimeout(() => {
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      }, 1500);
    }
  }

  const showContactList = !isMobile || !selectedContactId;
  const showChat = !isMobile || !!selectedContactId;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left Panel - Conversation List */}
      {showContactList && (
        <div className={cn(
          "flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm",
          isMobile ? "w-full" : "w-80 lg:w-96 shrink-0"
        )}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">Messages</h2>
              <Button
                onClick={() => {
                  setForwardingMessage(null);
                  setShowPicker((p) => !p);
                }}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/40 focus:bg-background transition-all rounded-xl h-10 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 pb-4">
            {isLoadingContacts ? (
              <div className="space-y-4 px-3 pt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-3 w-10 rounded" />
                      </div>
                      <Skeleton className="h-3 w-32 rounded opacity-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedContacts.map((contact) => {
                  const conv = convByContact.get(contact.id);
                  const isOnline = getContactOnlineStatus(contact);
                  const isActive = selectedContactId === contact.id || 
                    siblingContacts.some((sc) => sc.id === contact.id);
                  
                  return (
                    <button
                      key={contact.id}
                      onClick={() => {
                        handleSelectContact(contact);
                        setSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 text-left group relative",
                        isActive ? "bg-primary/5 shadow-sm" : "hover:bg-muted/50"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 w-1 h-8 bg-primary rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:scale-105 transition-transform duration-300">
                          {contact.avatar_url && <AvatarImage src={contact.avatar_url} className="object-cover" />}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{(contact.name || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full shadow-sm ring-2 ring-green-500/10" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={cn(
                            "font-semibold text-sm truncate transition-colors",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                          )}>
                            {contact.name}
                          </span>
                          {conv && (
                            <span className="text-[10px] font-medium text-muted-foreground/70 uppercase">
                              {formatMessageTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate leading-relaxed">
                          {conv?.last_message 
                            ? formatLastMessagePreview(conv.last_message) 
                            : (contact.company || "Click to start chatting")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Right Panel - Chat Area */}
      {showChat && (
        <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-border/40 bg-card/40 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchParams({});
                        setSelectedContactId(null);
                        setSelectedConversationId(null);
                      }}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <div 
                    onClick={() => navigate(`/dashboard/contacts/${selectedContact.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                    title={`View ${selectedContact.name}'s profile`}
                  >
                    <div className="relative">
                      <Avatar key={selectedContact.id} className="h-11 w-11 border-2 border-background shadow-md">
                        {selectedContact.avatar_url && <AvatarImage src={selectedContact.avatar_url} className="object-cover" />}
                        <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">{selectedContact.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground leading-tight tracking-tight hover:text-primary transition-colors">{selectedContact.name}</h2>
                      <div className="flex items-center mt-1">
                        {getContactOnlineStatus(selectedContact) ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/10 transition-all duration-300">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-[10px] font-bold tracking-wide uppercase">Online</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/50 transition-all duration-300">
                            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full" />
                            <span className="text-[10px] font-bold tracking-wide uppercase">Offline</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-all hover:bg-primary/5 rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer py-2.5"
                        onClick={async () => {
                          if (!selectedConversationId) return;
                          if (confirm("Are you sure you want to clear all messages in this chat?")) {
                            try {
                              await clearChat.mutateAsync(selectedConversationId);
                              toast({ title: "Chat cleared ✅" });
                            } catch (e) {
                              toast({ title: "Error clearing chat", variant: "destructive" });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer py-2.5 text-destructive focus:text-destructive"
                        onClick={() => {
                          toast({ title: "User blocked", description: "You will no longer receive messages from this contact." });
                        }}
                      >
                        <Ban className="h-4 w-4" />
                        Block User
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer py-2.5 text-destructive focus:text-destructive"
                        onClick={() => {
                          toast({ title: "Report submitted", description: "Our team will review this user's activity." });
                        }}
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Report User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Message List */}
              <ScrollArea className="flex-1 px-6">
                <div className="max-w-4xl mx-auto py-8">
                  {isLoadingMessages ? (
                    <div className="space-y-8">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={cn("flex items-end gap-3", i % 2 === 0 ? "flex-row" : "flex-row-reverse")}>
                          {i % 2 === 0 && <Skeleton className="h-9 w-9 rounded-full shrink-0" />}
                          <div className="space-y-2 flex flex-col items-start">
                            <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-56 lg:w-80" : "w-48 lg:w-72")} />
                            <Skeleton className="h-2 w-12 rounded opacity-30" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : allMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                        <MessageSquare className="h-10 w-10 text-primary/40" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">No messages yet</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                        Be the first to say hello to {selectedContact.name.split(' ')[0]} and start your conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {allMessages.map((msg, idx) => {
                        // Strict database identification fix for sender bleed
                        const isUser = msg.sender_type === "user";
                        const prevMsg = allMessages[idx - 1];
                        const nextMsg = allMessages[idx + 1];
                        
                        const isFirstInGroup = !prevMsg || prevMsg.sender_type !== msg.sender_type;
                        const isLastInGroup = !nextMsg || nextMsg.sender_type !== msg.sender_type;

                        // Inline quote parser
                        const isReply = msg.content.startsWith("> 📝 Replying to:");
                        let replyText = "";
                        let bodyText = msg.content;
                        if (isReply) {
                          const parts = msg.content.split("\n\n");
                          if (parts.length > 1) {
                            replyText = parts[0].replace("> 📝 Replying to:", "").trim();
                            bodyText = parts.slice(1).join("\n\n");
                          }
                        }

                        const isImg = isImageUrl(bodyText);
                        const isVid = isVideoUrl(bodyText);
                        const isAud = isAudioUrl(bodyText);
                        const isDoc = isAttachmentUrl(bodyText);

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex items-end gap-1.5 p-0 group relative", 
                              isUser ? "flex-row-reverse self-end" : "flex-row self-start",
                              "mt-2.5"
                            )}
                          >
                            {!isUser && (
                              <div className="w-8 shrink-0 flex justify-center">
                                {isLastInGroup ? (
                                  <Avatar className="h-8 w-8 border border-border/50">
                                    {selectedContact.avatar_url && <AvatarImage src={selectedContact.avatar_url} className="object-cover" />}
                                    <AvatarFallback className="text-[10px] bg-primary/5 font-bold text-primary">{selectedContact.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="w-8" />
                                )}
                              </div>
                            )}
                            <div className={cn("flex flex-col max-w-[85%] lg:max-w-[75%] p-0 m-0", isUser ? "items-end" : "items-start")}>
                              <div
                                className={cn(
                                  "px-4 py-2.5 transition-all duration-200 relative m-0 border-0 shadow-sm rounded-2xl flex flex-col min-w-[90px] gap-1",
                                  isUser
                                    ? "bg-indigo-600 text-white"
                                    : "bg-card border border-border/40 text-foreground"
                                )}
                              >
                                {/* Nested reply visualization block */}
                                {isReply && (
                                  <div className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs border-l-4 mb-1 text-left opacity-90 select-none max-w-xs truncate",
                                    isUser 
                                      ? "border-white/40 bg-white/10 text-white/90" 
                                      : "border-primary/50 bg-muted text-muted-foreground"
                                  )}>
                                    <span className="font-bold text-[9px] block uppercase opacity-75">Replying to</span>
                                    <span className="truncate block mt-0.5">{replyText}</span>
                                  </div>
                                )}

                                {editingMessageId === msg.id ? (
                                  <div className="flex flex-col gap-2 min-w-[200px]">
                                    <textarea
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      className="w-full bg-background/50 border border-border/40 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-1.5">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => setEditingMessageId(null)}
                                        className="h-7 text-xs hover:bg-white/15"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleSaveEdit(msg.id)}
                                        className="h-7 text-xs bg-primary hover:bg-primary/95 text-white"
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : isImg ? (
                                  <div className="relative rounded-xl overflow-hidden max-w-xs sm:max-w-sm md:max-w-md cursor-zoom-in hover:brightness-95 transition-all my-0.5">
                                    <img 
                                      src={bodyText} 
                                      alt="Attachment" 
                                      className={cn(
                                        "max-h-60 w-full object-cover rounded-xl border border-border/10",
                                        msg.isOptimistic && "blur-[2px] opacity-70"
                                      )}
                                      onClick={() => !msg.isOptimistic && window.open(bodyText, "_blank")}
                                    />
                                    {msg.isOptimistic && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 rounded-xl">
                                        <div className="h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                      </div>
                                    )}
                                  </div>
                                ) : isVid ? (
                                  <div className="relative rounded-xl overflow-hidden max-w-xs sm:max-w-sm md:max-w-md my-0.5">
                                    <video
                                      src={bodyText}
                                      controls
                                      playsInline
                                      preload="metadata"
                                      className="max-h-72 w-full rounded-xl border border-border/10 bg-black"
                                      style={{ maxWidth: "280px" }}
                                    />
                                  </div>
                                ) : isAud ? (
                                  <div className="my-1 min-w-[260px]">
                                    <div className="flex items-center gap-2 mb-1.5 opacity-90">
                                      <Music className={cn("h-4 w-4 shrink-0", isUser ? "text-white" : "text-primary")} />
                                      <span className="text-xs font-bold truncate">{getFileNameFromUrl(bodyText)}</span>
                                    </div>
                                    <audio
                                      src={bodyText}
                                      controls
                                      className="w-full h-8 rounded bg-transparent opacity-95 filter invert dark:invert-0"
                                    />
                                  </div>
                                ) : isDoc ? (
                                  <div 
                                    onClick={() => window.open(bodyText, "_blank")}
                                    className={cn(
                                      "flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none max-w-xs w-[260px] my-0.5 shadow-sm",
                                      isUser
                                        ? "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                                        : "bg-muted/50 hover:bg-muted border-border/40 text-foreground"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center shadow-inner",
                                      isUser ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                                    )}>
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                      <p className="text-xs font-bold truncate leading-tight">
                                        {getFileNameFromUrl(bodyText)}
                                      </p>
                                      <p className={cn(
                                        "text-[9px] font-bold tracking-wide uppercase leading-none opacity-60",
                                        isUser ? "text-white" : "text-foreground"
                                      )}>
                                        {bodyText.split('.').pop()?.split('?')[0].toUpperCase() || "FILE"} DOCUMENT
                                      </p>
                                    </div>
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile(bodyText, getFileNameFromUrl(bodyText));
                                      }}
                                      className={cn(
                                        "h-8 w-8 shrink-0 rounded-full flex items-center justify-center border transition-all cursor-pointer",
                                        isUser 
                                          ? "border-white/10 bg-white/5 hover:bg-white/10 text-white" 
                                          : "border-border/65 bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                                      )}
                                      title="Download file"
                                    >
                                      <Download className="h-4 w-4" />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words font-medium text-left w-full pr-1">{bodyText}</p>
                                )}
                                
                                <div className="flex items-center gap-1.5 mt-0.5 justify-end self-end select-none opacity-85">
                                  <span className={cn(
                                    "text-[9px] font-semibold leading-none",
                                    isUser ? "text-white/60" : "text-muted-foreground/60"
                                  )}>
                                    {format(new Date(msg.created_at), "h:mm a")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Floating premium message context dropdown menu */}
                            {!msg.isOptimistic && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center shrink-0 mx-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted/80 text-muted-foreground">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={isUser ? "end" : "start"} className="w-40 rounded-xl">
                                    <DropdownMenuItem 
                                      onClick={() => setReplyingTo(msg)}
                                      className="gap-2 cursor-pointer text-xs"
                                    >
                                      <Reply className="h-3.5 w-3.5" />
                                      Reply
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        navigator.clipboard.writeText(bodyText);
                                        toast({ title: "Copied to clipboard! 📋" });
                                      }}
                                      className="gap-2 cursor-pointer text-xs"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy Text
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setForwardingMessage(msg);
                                        setShowPicker(true);
                                      }}
                                      className="gap-2 cursor-pointer text-xs"
                                    >
                                      <Forward className="h-3.5 w-3.5" />
                                      Forward
                                    </DropdownMenuItem>
                                    {isUser && !isImg && !isVid && !isAud && !isDoc && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setEditingMessageId(msg.id);
                                          setEditingText(bodyText);
                                        }}
                                        className="gap-2 cursor-pointer text-xs"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit Message
                                      </DropdownMenuItem>
                                    )}
                                    {isUser && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            if (confirm("Unsend this message? This will delete it for both participants.")) {
                                              handleDeleteMessage(msg.id);
                                            }
                                          }}
                                          className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          Unsend
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input Area with reply state rendering */}
              <div className="p-6 bg-card/40 backdrop-blur-xl border-t border-border/40 relative">
                {replyingTo && (
                  <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2 mb-3 bg-muted/65 border border-border/50 rounded-2xl animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Reply className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 text-left">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-primary">Replying to {replyingTo.sender_type === "user" ? "yourself" : selectedContact.name.split(" ")[0]}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {replyingTo.content.startsWith("> 📝 Replying to:")
                            ? replyingTo.content.split("\n\n").slice(1).join("\n\n")
                            : replyingTo.content}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-6 w-6 rounded-full">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div className="max-w-4xl mx-auto flex items-end gap-3">
                  <div className="flex-1 relative group bg-background/50 rounded-[28px] border border-border/60 focus-within:border-primary/30 focus-within:bg-background focus-within:shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)] transition-all duration-500">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                      onChange={handleAttachmentUpload}
                    />
                    <textarea
                      placeholder="Type a message..."
                      rows={1}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent border-0 ring-0 focus:ring-0 px-6 py-4 text-[15px] max-h-32 resize-none placeholder:text-muted-foreground/40 transition-all scrollbar-none outline-none appearance-none text-left"
                    />
                    <div className="absolute right-4 bottom-3 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => attachmentInputRef.current?.click()}
                        disabled={uploadingAttachment}
                        className={cn(
                          "h-8 w-8 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded-full transition-all",
                          uploadingAttachment && "animate-pulse opacity-50 cursor-not-allowed"
                        )}
                        title="Upload file or photo"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    size="icon"
                    className={cn(
                      "h-14 w-14 shrink-0 rounded-full shadow-xl transition-all duration-500",
                      messageText.trim() 
                        ? "bg-primary text-white scale-100 shadow-primary/20 rotate-0" 
                        : "bg-muted text-muted-foreground scale-90 rotate-[-15deg] opacity-50"
                    )}
                  >
                    <Send className={cn(
                      "h-6 w-6 transition-transform duration-300",
                      messageText.trim() ? "translate-x-0.5 -translate-y-0.5" : "translate-x-0"
                    )} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
              <div className="h-32 w-32 bg-primary/5 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping" />
                <MessageSquare className="h-16 w-16 text-primary/20" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">Your Private Space</h2>
              <p className="text-muted-foreground mt-3 max-w-sm leading-relaxed">
                Send end-to-end encrypted messages to your professional network. 
                Select a contact from the left to begin your conversation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Contact Picker Modal for New Messages & Forwarding */}
      {showPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card w-full max-w-md rounded-[32px] shadow-2xl border border-border/40 overflow-hidden"
          >
            <div className="p-6 border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display font-bold text-foreground">
                  {forwardingMessage ? "Forward Message" : "New Message"}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowPicker(false); setPickerSearch(""); setForwardingMessage(null); }} className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  autoFocus
                  placeholder="Who would you like to message?"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="pl-9 h-11 bg-background border-border/40 rounded-xl"
                />
              </div>
            </div>
            
            <ScrollArea className="h-80">
              <div className="p-3 space-y-1">
                {uniqueContactsAlphabetical
                  .filter((c) => (c.name || "").toLowerCase().includes(pickerSearch.toLowerCase()))
                  .map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-all duration-300 text-left group"
                    >
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:scale-105 transition-transform duration-300">
                        {contact.avatar_url && <AvatarImage src={contact.avatar_url} className="object-cover" />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{(contact.name || "U").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{contact.name}</p>
                        {contact.company && <p className="text-xs text-muted-foreground mt-0.5">{contact.job_title} · {contact.company}</p>}
                      </div>
                    </button>
                  ))}
                {uniqueContactsAlphabetical.filter((c) => (c.name || "").toLowerCase().includes(pickerSearch.toLowerCase())).length === 0 && (
                  <div className="py-20 text-center space-y-2">
                    <Users className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm text-muted-foreground">No contacts found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </div>
      )}
    </div>
  );
}
