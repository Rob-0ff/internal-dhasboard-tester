"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, User, MessageSquareText, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoaderDots } from "@/components/ui/loaderDots";

interface Message {
  role: "user" | "model";
  content: string | ReactNode;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false); // State to toggle the chat window
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic (remains the same)
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (isOpen && messages.length === 0) {
        setIsLoading(true);
        try {
          const response = await fetch("/api/chat");
          const initialMessage = await response.json();
          setMessages([initialMessage]);
        } catch (error) {
          console.error("Failed to initialize chat:", error);
          setMessages([
            { role: "model", content: "Error: Could not connect." },
          ]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    initializeChat();
  }, [isOpen, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: input };
    const conversationHistory = [...messages, userMessage];
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "model", content: <LoaderDots /> },
    ]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ history: conversationHistory }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok || !response.body) throw new Error("Network error");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulatedResponse += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = accumulatedResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Streaming failed:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content =
          "Error: Could not get a response.";
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <Card className="w-96 h-[600px] flex flex-col shadow-xl mb-2">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Ask about your data</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "model" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <User size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Send
              </Button>
            </form>
          </div>
        </Card>
      )}

      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full shadow-lg bg-purple-500 hover:bg-purple-600 transition-colors"
        >
          <MessageSquareText />
        </Button>
      )}
    </div>
  );
}
