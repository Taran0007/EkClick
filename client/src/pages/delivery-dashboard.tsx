import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Truck, MapPin, DollarSign, Star, Route, Phone, Navigation, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(true);

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  // Filter orders assigned to this delivery person
  const assignedOrders = orders.filter(order => 
    order.deliveryPersonId === user?.id
  );

  const activeOrders = assignedOrders.filter(order => 
    !["delivered", "cancelled"].includes(order.status)
  );

  const completedOrders = assignedOrders.filter(order => 
    order.status === "delivered"
  );

  const todayOrders = assignedOrders.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.createdAt).toDateString() === today;
  });

  const todayEarnings = todayOrders
    .filter(order => order.status === "delivered")
    .reduce((sum, order) => sum + parseFloat(order.deliveryFee), 0);

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: "bg-blue-500",
      preparing: "bg-yellow-500",
      ready: "bg-orange-500",
      picked_up: "bg-purple-500",
      in_transit: "bg-blue-600",
      delivered: "bg-green-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      ready: "picked_up",
      picked_up: "in_transit",
      in_transit: "delivered",
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getStatusText = (status: string) => {
    const statusText = {
      ready: "Pick Up",
      picked_up: "Mark In Transit",
      in_transit: "Mark Delivered",
    };
    return statusText[status as keyof typeof statusText] || "Update";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.fullName}!
          </h1>
          <p className="text-gray-600">Your delivery dashboard</p>
        </div>

        {/* Availability Toggle */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Availability Status</h3>
                <p className="text-sm text-gray-600">Toggle your availability for new deliveries</p>
              </div>
              <div className="flex items-center space-x-3">
                <Label htmlFor="availability" className="text-sm text-gray-600">
                  {isAvailable ? "Online" : "Offline"}
                </Label>
                <Switch
                  id="availability"
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
                <Badge className={isAvailable ? "bg-green-500" : "bg-gray-500"}>
                  {isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">Target: 12</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">₹{todayEarnings.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-green-500">Today's earnings</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">4.9</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">65 reviews</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="text-2xl font-bold text-gray-900">45 km</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Route className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">Today's route</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Deliveries */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Deliveries</CardTitle>
                  <Badge variant="outline">{activeOrders.length} Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active deliveries</p>
                    <p className="text-sm text-gray-500">
                      {isAvailable 
                        ? "New deliveries will appear here when assigned" 
                        : "Turn on availability to receive new deliveries"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className={`border rounded-lg p-4 ${
                          order.status === "in_transit" ? "border-blue-300 bg-blue-50" : 
                          order.status === "picked_up" ? "border-purple-300 bg-purple-50" : 
                          "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">
                              <MapPin className="h-4 w-4 inline mr-1" />
                              {order.deliveryAddress}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-semibold">₹{order.totalAmount}</span>
                          <span className="text-sm text-gray-600">
                            Delivery Fee: ₹{order.deliveryFee}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {getNextStatus(order.status) && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const nextStatus = getNextStatus(order.status);
                                if (nextStatus) {
                                  updateOrderMutation.mutate({ 
                                    orderId: order.id, 
                                    status: nextStatus 
                                  });
                                }
                              }}
                              disabled={updateOrderMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {getStatusText(order.status)}
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Customer
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Navigation className="h-4 w-4 mr-2" />
                            Navigate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                {completedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No completed deliveries yet</p>
                    <p className="text-sm text-gray-500">Your delivery history will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Order</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Amount</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Fee</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedOrders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="border-b border-gray-100">
                            <td className="py-3 text-sm">#{order.orderNumber}</td>
                            <td className="py-3 text-sm">Customer</td>
                            <td className="py-3 text-sm">₹{order.totalAmount}</td>
                            <td className="py-3 text-sm font-semibold text-green-600">
                              ₹{order.deliveryFee}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                                <span className="text-sm">5.0</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Route Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Route</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                  alt="Delivery route map visualization"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Distance</span>
                    <span className="font-semibold">45 km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated Time</span>
                    <span className="font-semibold">3.5 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Fuel Cost</span>
                    <span className="font-semibold">₹180</span>
                  </div>
                </div>
                <Button className="w-full mt-4">
                  <Route className="h-4 w-4 mr-2" />
                  Optimize Route
                </Button>
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src="https://images.unsplash.com/photo-1558618666-7c0c3b18bf74?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                  alt="Modern delivery scooter"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Vehicle Type</span>
                    <span className="font-semibold">Honda Activa</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>License Plate</span>
                    <span className="font-semibold">DL 01 AB 1234</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Fuel Level</span>
                    <span className="font-semibold text-green-600">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">No new messages</p>
                    <p className="text-xs text-gray-500">Customer messages will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}
