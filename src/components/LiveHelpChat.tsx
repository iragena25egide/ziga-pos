"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, X, Send, ShieldCheck, Headphones } from "lucide-react";
import { getSocket } from "@/lib/socket";
import api from "@/lib/api";
import { toast } from "sonner";

interface Message {
  id?: number;
  company_id?: number | null;
  company_name?: string;
  sender_name: string;
  sender_role?: string;
  message: string;
  is_admin: boolean;
  is_read?: boolean;
  created_at: string;
}

export default function LiveHelpChat({ currentUser }: { currentUser?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const companyId = currentUser?.company || (typeof window !== "undefined" ? localStorage.getItem("company_id") : null);
  const isAdmin = currentUser?.is_superuser || currentUser?.role === "super_admin";

  // Hide the client help widget if the logged-in user is a Super Admin
  if (isAdmin) {
    return null;
  }

  // Load message history via REST API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/support-messages/");
        setMessages(res.data?.results || res.data || []);
      } catch (err) {
        // Silently fail if not logged in
      }
    };

    if (companyId) {
      fetchHistory();
    }
  }, [companyId]);

  // Connect to Socket.IO and listen for events
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      if (companyId) {
        socket.emit("join_company", { company_id: companyId });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (newMsg: Message) => {
      if (String(newMsg.company_id) === String(companyId) || !newMsg.company_id) {
        setMessages((prev) => {
          if (newMsg.id && prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });

        if (!isOpen && newMsg.is_admin) {
          setUnreadCount((c) => c + 1);
          toast.info(`New reply from Super Admin: "${newMsg.message.slice(0, 40)}..."`);
        }
      }
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

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [companyId, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText("");

    const senderName = currentUser?.first_name 
      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
      : (currentUser?.username || "Store Owner");

    const optimisticMsg: Message = {
      company_id: companyId ? Number(companyId) : null,
      company_name: currentUser?.company_name || "My Store",
      sender_name: senderName,
      sender_role: currentUser?.role || "company_admin",
      message: text,
      is_admin: false,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const socket = getSocket();
    if (socket.connected) {
      socket.emit("send_message", {
        company_id: companyId,
        message: text,
        sender_name: senderName,
        sender_role: currentUser?.role || "company_admin",
        is_admin: false,
      });
    } else {
      try {
        await api.post("/support-messages/", {
          message: text,
        });
      } catch (err) {
        toast.error("Could not send support message. Check your connection.");
      }
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

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg border border-gray-200 text-white font-medium text-xs tracking-wide"
          style={{ backgroundColor: "#0b1d3a" }}
        >
          <div className="relative">
            <Headphones className="w-4 h-4 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: "#1b5ebe" }} />
          </div>
          <span>Support & Help</span>

          {unreadCount > 0 && (
            <span className="ml-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 right-6 z-50 w-[380px] h-[520px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 text-white flex items-center justify-between" style={{ backgroundColor: "#0b1d3a" }}>
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
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f7fa] text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mb-3 text-gray-500">
                    <MessageSquareText className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-gray-800">How can we help you today?</p>
                  <p className="text-[11px] mt-1 text-gray-500 max-w-[220px]">
                    Have a question or need assistance? Write below to chat directly with support.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = !m.is_admin;
                  const time = m.created_at
                    ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-400">
                        {m.is_admin ? (
                          <span className="font-semibold text-blue-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Ziga Admin
                          </span>
                        ) : (
                          <span className="font-medium text-gray-600">{m.sender_name || "You"}</span>
                        )}
                        <span>•</span>
                        <span>{time}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-lg px-3.5 py-2 text-xs leading-relaxed border ${
                          isMe
                            ? "text-white border-transparent"
                            : "bg-white text-gray-800 border-gray-200"
                        }`}
                        style={{ backgroundColor: isMe ? "#1b5ebe" : "#ffffff" }}
                      >
                        {m.message}
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

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleTypingChange(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1b5ebe] focus:ring-1 focus:ring-[#1b5ebe] text-gray-900"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-8 px-3 rounded-md disabled:opacity-40 text-white flex items-center justify-center transition-all text-xs font-medium"
                style={{ backgroundColor: "#1b5ebe" }}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
