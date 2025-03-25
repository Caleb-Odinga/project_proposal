import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProfileAvatar from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  propertyId?: number;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  user: {
    id: number;
    username: string;
    fullName: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export default function Messages() {
  const [, params] = useRoute('/messages/:userId');
  const [, navigate] = useLocation();
  const { isAuthenticated, user, language } = useStore();
  const { toast } = useToast();
  
  const selectedUserId = params?.userId ? parseInt(params.userId) : undefined;
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
  });

  // Fetch messages with selected user
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: [`/api/messages/${selectedUserId}`],
    enabled: isAuthenticated && !!selectedUserId,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesData && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData]);

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-neutral-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-12 w-12 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-4">Login to View Messages</h2>
          <p className="text-neutral-600 mb-6">
            You need to be logged in to send and receive messages.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => navigate('/login')}>Login</Button>
            <Button variant="outline" onClick={() => navigate('/register')}>Register</Button>
          </div>
        </div>
      </div>
    );
  }

  // Send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast({
        title: "No recipient selected",
        description: "Please select a conversation to send a message",
        variant: "destructive",
      });
      return;
    }
    
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
      await apiRequest("POST", "/api/messages", {
        receiverId: selectedUserId,
        content: newMessage.trim()
      });
      
      setNewMessage('');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format message timestamp
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold mb-6">
        {translate("messages", language)}
      </h1>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[70vh]">
          {/* Conversations List */}
          <div className="border-r border-neutral-200">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="font-semibold">{translate("Conversations", language)}</h2>
            </div>
            
            <ScrollArea className="h-[calc(70vh-57px)]">
              {isLoadingConversations ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4 border-b border-neutral-200 flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conversation: Conversation) => (
                  <div 
                    key={conversation.user.id} 
                    className={`p-4 border-b border-neutral-200 flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 ${
                      selectedUserId === conversation.user.id ? 'bg-neutral-100' : ''
                    }`}
                    onClick={() => navigate(`/messages/${conversation.user.id}`)}
                  >
                    <ProfileAvatar user={conversation.user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{conversation.user.fullName}</h3>
                        <span className="text-xs text-neutral-500">
                          {formatMessageTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 truncate">
                        {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-neutral-500 mb-4">No conversations yet</p>
                  <Button size="sm" onClick={() => navigate('/')}>
                    Browse Properties
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Messages Area */}
          <div className="col-span-2 flex flex-col">
            {selectedUserId ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-neutral-200 flex items-center space-x-2">
                  {isLoadingMessages ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </>
                  ) : messagesData ? (
                    <>
                      <ProfileAvatar user={messagesData.user} />
                      <h2 className="font-semibold">{messagesData.user.fullName}</h2>
                    </>
                  ) : null}
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    // Loading skeleton
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <Skeleton className={`h-10 ${index % 2 === 0 ? 'w-56' : 'w-40'} rounded-lg`} />
                        </div>
                      ))}
                    </div>
                  ) : messagesData?.messages && messagesData.messages.length > 0 ? (
                    <div className="space-y-3">
                      {messagesData.messages.map((message: Message) => (
                        <div key={message.id} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            message.senderId === user?.id 
                              ? 'bg-primary text-white rounded-br-none' 
                              : 'bg-neutral-100 text-neutral-800 rounded-bl-none'
                          }`}>
                            <p>{message.content}</p>
                            <div className={`text-xs mt-1 ${message.senderId === user?.id ? 'text-white/70' : 'text-neutral-500'}`}>
                              {formatMessageTime(message.createdAt)}
                              {message.senderId === user?.id && (
                                <span className="ml-1">{message.read ? '• Read' : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                        <p className="text-neutral-500">No messages yet</p>
                        <p className="text-sm text-neutral-400">Send a message to start the conversation</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
                
                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-neutral-200 flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Card className="w-64">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                    <h3 className="font-semibold mb-2">No conversation selected</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Select a conversation from the list or start a new one by contacting a property owner.
                    </p>
                    <Button size="sm" onClick={() => navigate('/')}>
                      Browse Properties
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
