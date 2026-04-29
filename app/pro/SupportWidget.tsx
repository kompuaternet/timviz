"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
  const pollAbortRef = useRef<AbortController | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);
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

  const clearPolling = useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    isPollingRef.current = false;
  }, []);

  const scheduleNextPoll = useCallback((delayMs: number) => {
    if (!isOpen || !ticketId) {
      return;
    }

    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
    }

    pollTimeoutRef.current = window.setTimeout(() => {
      void loadTelegramReplies();
    }, delayMs);
  }, [isOpen, ticketId]);

  const loadTelegramReplies = useCallback(async () => {
    if (!isOpen || !ticketId || isPollingRef.current) {
      return;
    }

    const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";

    if (isHidden) {
      scheduleNextPoll(15000);
      return;
    }

    isPollingRef.current = true;
    const controller = new AbortController();
    pollAbortRef.current = controller;

    try {
      const params = new URLSearchParams({
        ticketId,
        after: lastMessageCreatedAt.current
      });
      const response = await fetch(`/api/pro/support?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal
      }).catch(() => null);

      if (!response?.ok) {
        scheduleNextPoll(12000);
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

      scheduleNextPoll(incomingMessages.length > 0 ? 4000 : 8000);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        scheduleNextPoll(12000);
      }
    } finally {
      isPollingRef.current = false;

      if (pollAbortRef.current === controller) {
        pollAbortRef.current = null;
      }
    }
  }, [isOpen, scheduleNextPoll, ticketId]);

  useEffect(() => {
    if (!isOpen || !ticketId) {
      clearPolling();
      return;
    }

    void loadTelegramReplies();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        clearPolling();
        void loadTelegramReplies();
        return;
      }

      clearPolling();
      scheduleNextPoll(15000);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearPolling();
    };
  }, [clearPolling, isOpen, loadTelegramReplies, scheduleNextPoll, ticketId]);

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

    if (response?.ok && isOpen) {
      clearPolling();
      scheduleNextPoll(1500);
    }
  }

  return (
    <>
      {showTrigger ? (
        <button type="button" className={styles.supportFloatingButton} onClick={onOpen} aria-label={t.support.open}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4.5c4.7 0 8.5 3.3 8.5 7.4s-3.8 7.4-8.5 7.4c-1.5 0-2.9-.3-4.1-.9L4.5 20l1-3.6C4.6 15.1 3.5 13.6 3.5 11.9c0-4.1 3.8-7.4 8.5-7.4Z" />
            <circle cx="9" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15" cy="12" r="0.8" fill="currentColor" stroke="none" />
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
