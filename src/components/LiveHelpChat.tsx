"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareText,
  X,
  Send,
  ShieldCheck,
  Headphones,
  Paperclip,
  FileText,
  Pencil,
  Trash2,
  Check,
  Download,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import api from "@/lib/api";
import { toast } from "sonner";

interface Message {
  id?: number;
  client_id?: string;
  company_id?: number | null;
  company?: number | null;
  company_name?: string;
  sender_name: string;
  sender_role?: string;
  message: string;
  attachment?: string | null;
  attachment_url?: string | null;
  is_admin: boolean;
  is_read?: boolean;
  created_at: string;
  updated_at?: string;
}

export default function LiveHelpChat({ currentUser }: { currentUser?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // File / Attachment State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Message State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Full-size image modal preview
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const companyId =
    currentUser?.company?.id != null
      ? currentUser.company.id
      : currentUser?.company != null
      ? currentUser.company
      : null;
  const isAdmin = currentUser?.is_superuser || currentUser?.role === "super_admin";

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    window.addEventListener("toggle_support_chat", handleToggle);
    window.addEventListener("open_support_chat", handleOpen);
    window.addEventListener("close_support_chat", handleClose);
    return () => {
      window.removeEventListener("toggle_support_chat", handleToggle);
      window.removeEventListener("open_support_chat", handleOpen);
      window.removeEventListener("close_support_chat", handleClose);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("support_unread_count", { detail: unreadCount })
      );
    }
  }, [unreadCount]);

  // Load message history via REST API (handles offline catch-up and synchronization)
  const fetchHistory = useCallback(async () => {
    if (isAdmin) return;
    try {
      const res = await api.get("/support-messages/");
      const list: Message[] = Array.isArray(res.data) ? res.data : res.data?.results || [];

      setMessages((prev) => {
        // Keep optimistic messages that haven't received server response yet
        const pendingOptimistic = prev.filter(
          (p) =>
            !p.id &&
            !list.some(
              (s) =>
                (p.client_id && s.client_id === p.client_id) ||
                (s.message === p.message && Boolean(s.is_admin) === Boolean(p.is_admin))
            )
        );

        // If list is identical to existing, skip state update to prevent UI flicker
        if (
          pendingOptimistic.length === 0 &&
          prev.length === list.length &&
          prev.every((p, i) => p.id === list[i].id && p.message === list[i].message)
        ) {
          return prev;
        }

        return [...list, ...pendingOptimistic];
      });

      // Update unread count for admin messages when drawer is closed
      if (!isOpenRef.current) {
        const unreadAdmin = list.filter((m) => m.is_admin && !m.is_read).length;
        setUnreadCount(unreadAdmin);
      }
    } catch (err) {
      // Silently fail if not logged in or temporary offline
    }
  }, [isAdmin]);

  // Re-fetch immediately whenever companyId changes or when user opens the chat drawer
  useEffect(() => {
    if (companyId) {
      fetchHistory();
    }
  }, [companyId, fetchHistory]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setUnreadCount(0);
    }
  }, [isOpen, fetchHistory]);

  // Background Auto-Sync Polling:
  // When chat is open: poll every 3.5s so messages are delivered even if socket is disconnected/offline!
  // When chat is closed: poll every 12s in background to update unread badge!
  useEffect(() => {
    if (isAdmin) return;
    const pollInterval = setInterval(() => {
      fetchHistory();
    }, isOpen ? 3500 : 12000);

    return () => clearInterval(pollInterval);
  }, [isAdmin, isOpen, fetchHistory]);

  // Connect to Socket.IO and listen for events
  useEffect(() => {
    if (isAdmin) return;
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      if (companyId) {
        socket.emit("join_company", { company_id: companyId });
      }
      // Instantly catch up on any messages received while offline/reconnecting
      fetchHistory();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (newMsg: Message) => {
      const msgCompanyId = newMsg.company_id ?? newMsg.company;
      if (String(msgCompanyId) === String(companyId) || !msgCompanyId) {
        setMessages((prev) => {
          // 1. Check if message already exists by server ID
          if (newMsg.id && prev.some((m) => m.id === newMsg.id)) {
            return prev.map((m) => (m.id === newMsg.id ? { ...m, ...newMsg } : m));
          }

          // 2. Check if client_id matches an optimistic message
          if (newMsg.client_id && prev.some((m) => m.client_id === newMsg.client_id)) {
            return prev.map((m) => (m.client_id === newMsg.client_id ? newMsg : m));
          }

          // 3. Fallback: match optimistic placeholder (no id, same message text and sender type)
          const optimisticIndex = prev.findIndex(
            (m) =>
              !m.id &&
              m.message === newMsg.message &&
              Boolean(m.is_admin) === Boolean(newMsg.is_admin)
          );
          if (optimisticIndex !== -1) {
            const updated = [...prev];
            updated[optimisticIndex] = newMsg;
            return updated;
          }

          return [...prev, newMsg];
        });

        if (!isOpen && newMsg.is_admin) {
          setUnreadCount((c) => c + 1);
          toast.info(`New reply from Support: "${(newMsg.message || "Sent an attachment").slice(0, 40)}..."`);
        }
      }
    };

    const handleUpdateMessage = (updatedMsg: Message) => {
      const msgCompanyId = updatedMsg.company_id ?? updatedMsg.company;
      if (String(msgCompanyId) === String(companyId) || !msgCompanyId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
        );
      }
    };

    const handleDeleteMessage = (data: { id: number; company_id?: number }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
    };

    const handleTyping = (data: { is_admin: boolean; name: string }) => {
      if (data.is_admin) {
        setAdminTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setAdminTyping(false);
        }, 2500);
      }
    };

    const handleConversationCleared = (data: { company_id: number }) => {
      if (!companyId || String(data.company_id) === String(companyId)) {
        setMessages([]);
        toast.info("Support chat history was cleared by Administrator.");
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("update_message", handleUpdateMessage);
    socket.on("delete_message", handleDeleteMessage);
    socket.on("conversation_cleared", handleConversationCleared);
    socket.on("user_typing", handleTyping);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("update_message", handleUpdateMessage);
      socket.off("delete_message", handleDeleteMessage);
      socket.off("conversation_cleared", handleConversationCleared);
      socket.off("user_typing", handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [companyId, isOpen, isAdmin]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // File Picker Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB limit.");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text && !selectedFile) return;

    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const senderName = currentUser?.first_name
      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
      : currentUser?.username || "Store Owner";

    const optimisticMsg: Message = {
      client_id: clientId,
      company_id: companyId ? Number(companyId) : null,
      company_name: currentUser?.company_name || "My Store",
      sender_name: senderName,
      sender_role: currentUser?.role || "company_admin",
      message: text,
      attachment_url: filePreview || null,
      is_admin: false,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    const fileToSend = selectedFile;
    handleClearFile();
    setIsSubmitting(true);

    try {
      if (fileToSend) {
        const formData = new FormData();
        formData.append("message", text);
        formData.append("attachment", fileToSend);
        if (companyId) formData.append("company", String(companyId));

        const res = await api.post("/support-messages/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const savedData: Message = res.data;
        setMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...savedData, client_id: clientId } : m))
        );
      } else {
        const res = await api.post("/support-messages/", {
          message: text,
          ...(companyId ? { company: companyId } : {}),
        });

        const savedData: Message = res.data;
        setMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...savedData, client_id: clientId } : m))
        );
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.response?.data && typeof err.response.data === "object"
          ? Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : null);
      toast.error(errorMsg || "Failed to send support message. Check network.");
      setMessages((prev) => prev.filter((m) => m.client_id !== clientId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (msg: Message) => {
    if (!msg.id) return;
    setEditingId(msg.id);
    setEditingText(msg.message);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const handleSaveEdit = async (msgId: number) => {
    if (!editingText.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    setEditLoading(true);
    try {
      const res = await api.patch(`/support-messages/${msgId}/`, {
        message: editingText.trim(),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, ...res.data } : m))
      );
      setEditingId(null);
      setEditingText("");
      toast.success("Message updated");
    } catch (err) {
      toast.error("Failed to update message.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/support-messages/${msgId}/`);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message.");
    }
  };

  const handleTypingChange = (val: string) => {
    setInputText(val);
    const socket = getSocket();
    if (socket.connected && companyId) {
      socket.emit("typing", {
        company_id: companyId,
        is_admin: false,
        name: currentUser?.username || "User",
      });
    }
  };

  const isImageFile = (url?: string | null) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
  };

  if (isAdmin) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-3 sm:bottom-6 left-2 sm:left-4 md:left-60 z-50 w-[95vw] sm:w-[420px] max-w-[420px] h-[82vh] sm:h-[580px] max-h-[640px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 text-white flex items-center justify-between shadow-xs" style={{ backgroundColor: "#0b1d3a" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1b5ebe" }}>
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm tracking-tight text-white">Ziga Live Support</h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span>{isConnected ? "Super Admin Online" : "Connecting..."}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-3 text-gray-500">
                    <MessageSquareText className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-gray-800">How can we help you today?</p>
                  <p className="text-[11px] mt-1 text-gray-500 max-w-[240px]">
                    Have a question or need assistance? Write below to chat directly with support.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = !m.is_admin;
                  const time = m.created_at
                    ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  const isEditingThis = editingId === m.id;
                  const hasImage = isImageFile(m.attachment_url);
                  const hasFile = m.attachment_url && !hasImage;

                  return (
                    <div
                      key={m.id ? `msg-${m.id}` : m.client_id || `idx-${idx}`}
                      className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                        {m.is_admin ? (
                          <span className="font-semibold text-blue-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Ziga Support
                          </span>
                        ) : (
                          <span className="font-medium text-gray-600">{m.sender_name || "You"}</span>
                        )}
                        <span>•</span>
                        <span>{time}</span>
                        {m.updated_at && m.updated_at !== m.created_at && (
                          <span className="italic text-[9px] text-gray-400">(edited)</span>
                        )}
                      </div>

                      <div className="relative max-w-[85%]">
                        {isEditingThis ? (
                          <div className="bg-white border border-blue-400 rounded-xl p-2.5 shadow-md w-64">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={2}
                              className="w-full text-xs text-gray-900 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#1b5ebe]"
                            />
                            <div className="flex items-center justify-end gap-1.5 mt-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={editLoading}
                                className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(m.id!)}
                                disabled={editLoading || !editingText.trim()}
                                className="px-2.5 py-1 text-[11px] bg-[#1b5ebe] text-white rounded font-medium flex items-center gap-1 disabled:opacity-50"
                              >
                                {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs border ${
                              isMe
                                ? "text-white border-transparent rounded-br-xs"
                                : "bg-white text-gray-900 border-gray-200 rounded-bl-xs"
                            }`}
                            style={{ backgroundColor: isMe ? "#1b5ebe" : "#ffffff" }}
                          >
                            {/* Attached Image */}
                            {hasImage && m.attachment_url && (
                              <div className="mb-2 relative group/img overflow-hidden rounded-lg border border-black/10">
                                <img
                                  src={m.attachment_url}
                                  alt="Attachment"
                                  onClick={() => setActivePreviewImage(m.attachment_url!)}
                                  className="max-h-48 w-full object-cover rounded cursor-pointer hover:opacity-95 transition-opacity"
                                />
                                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs rounded-md p-1">
                                  <a
                                    href={m.attachment_url}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Download image"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-white hover:text-blue-300 p-0.5"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Attached Document File */}
                            {hasFile && m.attachment_url && (
                              <div
                                className={`flex items-center gap-2 p-2 rounded-lg mb-2 text-[11px] font-medium border ${
                                  isMe
                                    ? "bg-white/10 text-white border-white/20"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                <a
                                  href={m.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate flex-1 hover:underline"
                                >
                                  {m.attachment_url.split("/").pop()}
                                </a>
                                <a
                                  href={m.attachment_url}
                                  download
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Download file"
                                  className={`p-1 rounded transition-colors ${
                                    isMe
                                      ? "hover:bg-white/20 text-white"
                                      : "hover:bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}

                            {m.message && <p className="whitespace-pre-wrap">{m.message}</p>}
                          </div>
                        )}

                        {/* Owner Edit / Delete buttons */}
                        {isMe && m.id && !isEditingThis && (
                          <div className="absolute top-1 -left-14 hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 shadow-md rounded-md p-0.5">
                            <button
                              onClick={() => handleStartEdit(m)}
                              title="Edit message"
                              className="p-1 text-gray-500 hover:text-[#1b5ebe] rounded transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(m.id!)}
                              title="Delete message"
                              className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {adminTyping && (
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#1b5ebe" }} />
                  <span>Admin is typing a reply...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected Attachment Preview Banner */}
            {selectedFile && (
              <div className="px-3.5 py-2 bg-blue-50/80 border-t border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="preview"
                      className="w-7 h-7 object-cover rounded border border-blue-200 shrink-0"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                  <span className="truncate font-medium text-gray-800">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image or file"
                className="h-8 w-8 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-[#1b5ebe] flex items-center justify-center transition-colors shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => handleTypingChange(e.target.value)}
                placeholder="Type your message..."
                disabled={isSubmitting}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-[#1b5ebe] focus:ring-1 focus:ring-[#1b5ebe] text-gray-900"
              />

              <button
                type="submit"
                disabled={isSubmitting || (!inputText.trim() && !selectedFile)}
                className="h-8 px-3.5 rounded-lg disabled:opacity-40 text-white flex items-center justify-center transition-all text-xs font-medium cursor-pointer shrink-0"
                style={{ backgroundColor: "#1b5ebe" }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-size Image Preview Modal */}
      <AnimatePresence>
        {activePreviewImage && (
          <div
            onClick={() => setActivePreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[90vh] bg-transparent flex flex-col items-center"
            >
              <button
                onClick={() => setActivePreviewImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={activePreviewImage}
                alt="Enlarged attachment"
                className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={activePreviewImage}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b5ebe] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Image
                </a>
                <a
                  href={activePreviewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs hover:bg-white/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open original
                </a>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
