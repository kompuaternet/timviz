"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./pro.module.css";
import { useProLanguage } from "./useProLanguage";

type SupportWidgetProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  showTrigger?: boolean;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  createdAt?: string;
};

export default function SupportWidget({
  isOpen,
  onOpen,
  onClose,
  showTrigger = true
}: SupportWidgetProps) {
  const { language, t } = useProLanguage();
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "failed" | "empty">("idle");
  const lastMessageCreatedAt = useRef("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "hello",
      role: "bot",
      text: t.support.botGreeting
    }
  ]);

  useEffect(() => {
    const storedTicketId = window.localStorage.getItem("rezervo-support-ticket-id") || "";
    setTicketId(storedTicketId);

    setMessages((current) =>
      current.length === 1 && current[0].id === "hello"
        ? [{ id: "hello", role: "bot", text: t.support.botGreeting }]
        : current
    );
  }, [t.support.botGreeting]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    async function loadTelegramReplies() {
      if (!ticketId) {
        return;
      }

      const params = new URLSearchParams({
        ticketId,
        after: lastMessageCreatedAt.current
      });
      const response = await fetch(`/api/pro/support?${params.toString()}`, {
        cache: "no-store"
      }).catch(() => null);

      if (!response?.ok || isCancelled) {
        return;
      }

      const payload = await response.json() as {
        messages?: Array<{ id: string; role: "bot" | "user"; text: string; createdAt: string }>;
      };

      const incomingMessages = (payload.messages ?? []).filter((item) => item.text.trim());

      if (incomingMessages.length > 0) {
        lastMessageCreatedAt.current = incomingMessages[incomingMessages.length - 1].createdAt;
        setMessages((current) => [
          ...current,
          ...incomingMessages.filter((item) => !current.some((message) => message.id === item.id))
        ]);
      }
    }

    loadTelegramReplies();
    const intervalId = window.setInterval(loadTelegramReplies, 4000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isOpen, ticketId]);

  async function submitSupportMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setStatus("empty");
      return;
    }

    const outgoingMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedMessage
    };

    setMessages((current) => [...current, outgoingMessage]);
    setMessage("");
    setStatus("idle");
    setIsSending(true);

    const response = await fetch("/api/pro/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: trimmedMessage,
        ticketId,
        language,
        page: window.location.pathname
      })
    }).catch(() => null);

    const payload = response?.ok
      ? await response.json().catch(() => null) as { ticketId?: string } | null
      : null;

    if (payload?.ticketId) {
      setTicketId(payload.ticketId);
      window.localStorage.setItem("rezervo-support-ticket-id", payload.ticketId);
    }

    setIsSending(false);
    setStatus(response?.ok ? "sent" : "failed");
  }

  return (
    <>
      {showTrigger ? (
        <button type="button" className={styles.supportFloatingButton} onClick={onOpen} aria-label={t.support.open}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.4 8.4 0 0 1-8.8 8.4 9.8 9.8 0 0 1-4.4-1.1L3 20l1.3-4.2A8.1 8.1 0 0 1 3 11.5a8.5 8.5 0 0 1 18 0Z" />
            <path d="M8.2 11.7h.1M12 11.7h.1M15.8 11.7h.1" />
          </svg>
        </button>
      ) : null}

      {isOpen ? (
        <div className={styles.supportOverlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}>
          <aside className={styles.supportPanel} aria-label={t.support.title}>
            <header className={styles.supportHeader}>
              <div>
                <span>{t.support.instructionTitle}</span>
                <h2>{t.support.title}</h2>
              </div>
              <button type="button" onClick={onClose} aria-label={t.support.close}>×</button>
            </header>

            <div className={styles.supportGuide}>
              <strong>{t.support.supportTitle}</strong>
              <p>{t.support.instructionText}</p>
              {ticketId ? <small>{ticketId}</small> : null}
            </div>

            <div className={styles.supportMessages}>
              {messages.map((item) => (
                <div key={item.id} className={`${styles.supportBubble} ${item.role === "user" ? styles.supportBubbleUser : ""}`}>
                  {item.text}
                </div>
              ))}
            </div>

            <form className={styles.supportComposer} onSubmit={submitSupportMessage}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t.support.placeholder}
                rows={3}
              />
              <button type="submit" disabled={isSending}>{isSending ? t.support.sending : t.support.send}</button>
            </form>

            {status !== "idle" ? (
              <p className={`${styles.supportStatus} ${status === "failed" || status === "empty" ? styles.supportStatusError : ""}`}>
                {status === "sent" ? t.support.sent : status === "empty" ? t.support.empty : t.support.failed}
              </p>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
