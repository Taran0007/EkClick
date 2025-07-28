import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { useWebSocket } from "@/lib/websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Chat {
  id: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function ChatWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lastMessage } = useWebSocket();

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user && isOpen,
  });

  const { data: chats = [] } = useQuery({
    queryKey: ["/api/orders", selectedOrderId, "chats"],
    enabled: !!selectedOrderId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { orderId: string; receiverId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/chats", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "chats"] });
      setMessage("");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  // Handle real-time chat messages
  useEffect(() => {
    if (lastMessage?.type === 'chat_message' && selectedOrderId) {
      const chatMessage = lastMessage.data as Chat;
      if (chatMessage.orderId === selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "chats"] });
      }
    }
  }, [lastMessage, selectedOrderId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const ordersWithChats = orders.filter(order => 
    order.status !== "delivered" && order.status !== "cancelled"
  );

  const handleSendMessage = () => {
    if (!message.trim() || !selectedOrderId) return;

    // Determine receiver based on user role and order details
    let receiverId = "";
    const order = orders.find(o => o.id === selectedOrderId);
    
    if (!order) return;

    if (user?.role === "user") {
      receiverId = order.deliveryPersonId || order.vendorId;
    } else if (user?.role === "vendor") {
      receiverId = order.userId;
    } else if (user?.role === "delivery") {
      receiverId = order.userId;
    }

    if (receiverId) {
      sendMessageMutation.mutate({
        orderId: selectedOrderId,
        receiverId,
        message: message.trim(),
      });
    }
  };

  const getChatPartnerName = (chat: Chat) => {
    if (chat.senderId === user?.id) return "You";
    
    const order = orders.find(o => o.id === chat.orderId);
    if (!order) return "Unknown";

    if (user?.role === "user") {
      return chat.senderId === order.vendorId ? "Vendor" : "Delivery Partner";
    } else if (user?.role === "vendor") {
      return "Customer";
    } else if (user?.role === "delivery") {
      return "Customer";
    }
    
    return "Unknown";
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full shadow-lg chat-widget bg-primary hover:bg-primary/90"
          >
            <MessageCircle className="h-6 w-6" />
            {ordersWithChats.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
                {ordersWithChats.length}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96 chat-widget">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-lg">
                {selectedOrderId ? `Chat - Order #${orders.find(o => o.id === selectedOrderId)?.orderNumber}` : "Messages"}
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedOrderId(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="flex-1 flex flex-col p-4 pt-0">
                {!selectedOrderId ? (
                  // Order List
                  <div className="space-y-2">
                    {ordersWithChats.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No active orders</p>
                        <p className="text-xs text-gray-500">Start chatting when you have active orders</p>
                      </div>
                    ) : (
                      ordersWithChats.map((order) => (
                        <div
                          key={order.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                              <p className="text-xs text-gray-500">
                                {user.role === "user" ? "Chat with vendor & delivery" : 
                                 user.role === "vendor" ? "Chat with customer" :
                                 "Chat with customer"}
                              </p>
                            </div>
                            <Badge className={`status-${order.status}`}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Chat View
                  <>
                    <div className="flex items-center mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrderId(null)}
                      >
                        ← Back
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-2">
                        {chats.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-600">No messages yet</p>
                            <p className="text-xs text-gray-500">Start the conversation!</p>
                          </div>
                        ) : (
                          chats.map((chat) => (
                            <div
                              key={chat.id}
                              className={`flex ${
                                chat.senderId === user.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[75%] p-2 rounded-lg text-sm ${
                                  chat.senderId === user.id
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="text-xs opacity-75 mb-1">
                                  {getChatPartnerName(chat)}
                                </p>
                                <p>{chat.message}</p>
                                <p className="text-xs opacity-60 mt-1">
                                  {format(new Date(chat.createdAt), "HH:mm")}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
