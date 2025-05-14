import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Send, Trash2 } from "lucide-react";
import { IoChatbubblesOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
  };
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

export default function Chat({ auth }: ChatProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = auth;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Load chat history from localStorage when component mounts
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const savedMessages = localStorage.getItem(`chat_history_${user.id}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(parsedMessages);
        } catch (error) {
          console.error("Error parsing saved messages:", error);
          // If there's an error, initialize with welcome message
          setMessages([
            {
              id: "1",
              text: "Hello! How can I help you with your food choices today?",
              sender: "assistant",
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        // If no saved messages, initialize with welcome message
        setMessages([
          {
            id: "1",
            text: "Hello! How can I help you with your food choices today?",
            sender: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [isAuthenticated, user]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isAuthenticated && user?.id && messages.length > 0) {
      localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, isAuthenticated, user]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Clear input and set loading state
    const userQuery = newMessage;
    setNewMessage("");
    setIsLoading(true);

    try {
      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(
        localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
      );
      const accessToken = supabaseAuth?.access_token || "";

      // Format the history properly - only include the last 10 messages
      // Don't include the message we just added (it will be sent as the query)
      const formattedHistory = messages.slice(-10).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      // Send the query to the API with properly structured chat history
      const response = await fetchApi("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          query: userQuery,
          history: formattedHistory,
        }),
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer || "I'm sorry, I couldn't process your question.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Show error toast
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to get a response",
        variant: "destructive",
      });

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error processing your question. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear chat history
  const clearChatHistory = () => {
    // Clear messages from state
    setMessages([
      {
        id: "1",
        text: "Hello! How can I help you with your food choices today?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ]);

    // Clear from localStorage
    if (isAuthenticated && user?.id) {
      localStorage.removeItem(`chat_history_${user.id}`);
    }

    // Show success toast
    toast({
      title: "Chat history cleared",
      description: "Your conversation history has been cleared.",
      variant: "default",
    });

    // Close the dialog
    setShowClearDialog(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 mt-20">
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <IoChatbubblesOutline className="h-5 w-5 text-primary mr-2" />
              Food Assistant Chat
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </Button>
          </div>
          <CardDescription>
            Ask questions about food, nutrition, and dietary needs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      message.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {message.sender === "assistant" && (
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-primary text-white">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {message.sender === "user" && (
                      <Avatar className="h-8 w-8 ml-2">
                        <AvatarFallback className="bg-black text-white">
                          {user?.email
                            ? user.email.charAt(0).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* AI Thinking Bubble */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%]">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-primary text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-2 bg-muted">
                      <div className="flex space-x-1">
                        <div
                          className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "600ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invisible div for scrolling to bottom */}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about food, nutrition, or dietary needs..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 rounded-full"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  className="rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your entire conversation history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearChatHistory}
              className="bg-destructive text-destructive-foreground"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
