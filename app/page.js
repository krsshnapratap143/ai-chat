"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [streamResponse, setStreamResponse] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false); // For /api/chat
  const [isStreamLoading, setIsStreamLoading] = useState(false); // For /api/chat-stream

  const handleChat = async () => {
    if (!message.trim()) {
      setResponse("Error: Please enter a message");
      return;
    }
    setIsChatLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setResponse(data.response || "No response received");
    } catch (error) {
      setResponse("Error: " + error.message);
    }
    setIsChatLoading(false);
  };

  const handleStreamChat = async () => {
    if (!message.trim()) {
      setStreamResponse("Error: Please enter a message");
      return;
    }
    setIsStreamLoading(true);
    setStreamResponse("");
    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              setIsStreamLoading(false);
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                setStreamResponse(`Error: ${data.error} - ${data.details}`);
                setIsStreamLoading(false);
                break;
              }
              setStreamResponse((prev) => prev + (data.content || ""));
            } catch (parseError) {
              console.error("SSE JSON parse error:", parseError);
            }
          }
        }
      }
    } catch (error) {
      setStreamResponse("Error: " + error.message);
      setIsStreamLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Getting Started with Next.js and AI</h1>
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your awesome message"
          rows={4}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <button
          onClick={handleChat}
          style={{ padding: "10px 20px", backgroundColor: "orange" }}
          disabled={isChatLoading}
        >
          {isChatLoading ? "Loading..." : "Chat"}
        </button>
        <button
          onClick={handleStreamChat}
          style={{ padding: "10px 20px", backgroundColor: "green", margin: "5px" }}
          disabled={isStreamLoading}
        >
          {isStreamLoading ? "Loading..." : "Stream Chat"}
        </button>
      </div>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          whiteSpace: "pre-wrap",
          fontSize: "28px",
        }}
      >
        {response}
      </div>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          whiteSpace: "pre-wrap",
          fontSize: "28px",
        }}
      >
        {streamResponse}
      </div>
    </div>
  );
}