import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, Truck, Gift, Ticket, Star, MessageCircle, Share } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { OrderTracking } from "@/components/orders/order-tracking";

export default function UserDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ["/api/coupons"],
  });

  const activeOrders = orders.filter(order => 
    !["delivered", "cancelled"].includes(order.status)
  );

  const getOrderProgress = (status: string) => {
    const statusMap = {
      pending: 10,
      confirmed: 25,
      preparing: 40,
      ready: 55,
      picked_up: 70,
      in_transit: 85,
      delivered: 100
    };
    return statusMap[status as keyof typeof statusMap] || 0;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: "bg-gray-500",
      confirmed: "bg-blue-500",
      preparing: "bg-yellow-500",
      ready: "bg-orange-500",
      picked_up: "bg-purple-500",
      in_transit: "bg-blue-600",
      delivered: "bg-green-500",
      cancelled: "bg-red-500"
    };
    return colorMap[status as keyof typeof colorMap] || "bg-gray-500";
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.fullName}!
          </h1>
          <p className="text-gray-600">Discover great vendors and track your orders</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <Search className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-semibold">Browse Shops</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <Truck className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <div className="font-semibold">Track Orders</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <Gift className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Referrals</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <Ticket className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="font-semibold">Coupons</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Orders</CardTitle>
                  <Badge variant="secondary">{activeOrders.length} Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active orders</p>
                    <p className="text-sm text-gray-500">Your orders will appear here once you place them</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">Total: ₹{order.totalAmount}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Order Confirmed</span>
                            <span>Delivered</span>
                          </div>
                          <Progress value={getOrderProgress(order.status)} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            Track Order
                          </Button>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Search and List */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Vendors Near You</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search vendors or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredVendors.slice(0, 6).map((vendor) => (
                    <div key={vendor.id} className="border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
                      <img 
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                        alt={vendor.shopName}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold mb-1">{vendor.shopName}</h3>
                      <p className="text-sm text-gray-600 mb-2">{vendor.category}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{vendor.rating || "4.5"} ({vendor.totalReviews || 0} reviews)</span>
                        </div>
                        <span className="text-sm text-gray-500">25 min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Referral Program */}
            <Card className="bg-gradient-to-br from-primary to-emerald-700 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Refer & Earn</h3>
                <p className="text-sm opacity-90 mb-4">
                  Invite friends and earn ₹50 for each successful referral
                </p>
                <div className="bg-white/20 rounded-lg p-3 mb-4">
                  <div className="text-xs opacity-80 mb-1">Your Referral Code</div>
                  <div className="font-mono font-semibold">{user.referralCode}</div>
                </div>
                <Button className="w-full bg-white text-primary hover:bg-gray-100">
                  <Share className="h-4 w-4 mr-2" />
                  Share Code
                </Button>
              </CardContent>
            </Card>

            {/* Available Coupons */}
            <Card>
              <CardHeader>
                <CardTitle>Available Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                {coupons.length === 0 ? (
                  <div className="text-center py-4">
                    <Ticket className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No coupons available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coupons.slice(0, 3).map((coupon) => (
                      <div key={coupon.id} className="border border-dashed border-orange-300 rounded-lg p-3 bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-orange-600">{coupon.code}</span>
                          <span className="text-sm text-gray-500">
                            {coupon.discountType === 'fixed' ? '₹' : ''}{coupon.discountValue}
                            {coupon.discountType === 'percentage' ? '%' : ''} off
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{coupon.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Chats */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Chats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Support</div>
                      <div className="text-xs text-gray-500">How can we help you?</div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Tracking Modal */}
      {selectedOrderId && (
        <OrderTracking
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
