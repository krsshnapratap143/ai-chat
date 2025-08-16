"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState("");
  const [streamResponse, setStreamResponse] = useState("");

  const handleChat = async () => {
    setLoading(true)
    setResponse("")
    try{
      const res = await fetch("/api/chat", {
        method: "POST", 
        headers: {
          "content-type" : "application/json"
        }, 
        body: JSON.stringify({message})
      })
      const data = await res.json()
      setResponse(data.response)
    }
    catch (error) {
      setResponse("error : " + error.message)
    }
    setLoading(false)
  }

  return(
    <div className={styles.page}>
      <h1>getting started with nextjs and ai</h1>
      <div>
        <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="enter your awesome message"
        rows={4}
        style={{width: "100%", marginBottom: "10px"}}
        />
      </div>
      <div>
        <button 
        onClick={handleChat}
        style={{padding: "10px 20px", backgroundColor: "orange"}}>{loading ? "loading..." : "chat"}
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
    </div>
  )
}
