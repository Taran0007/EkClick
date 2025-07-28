import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVendorSchema, insertCouponSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Users, Store, Bike, TrendingUp, AlertTriangle, 
  Plus, Edit, Eye, UserPlus, Ticket, BarChart3,
  CheckCircle, Clock, XCircle
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const vendorSchema = insertVendorSchema;
const couponSchema = insertCouponSchema;
const userSchema = insertUserSchema.omit({ referralCode: true });

type VendorData = z.infer<typeof vendorSchema>;
type CouponData = z.infer<typeof couponSchema>;
type UserData = z.infer<typeof userSchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user && user.role === "admin",
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user && user.role === "admin",
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "admin",
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ["/api/disputes"],
    enabled: !!user && user.role === "admin",
  });

  const vendorForm = useForm<VendorData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      userId: "",
      shopName: "",
      shopDescription: "",
      category: "",
      address: "",
      city: "",
      isOpen: true,
      feeStatus: "pending",
    },
  });

  const couponForm = useForm<CouponData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "fixed",
      discountValue: "0",
      minOrderAmount: "0",
      usageLimit: 100,
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const userForm = useForm<UserData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      phone: "",
      role: "delivery",
      isActive: true,
      address: "",
      city: "",
    },
  });

  const addVendorMutation = useMutation({
    mutationFn: async (data: VendorData) => {
      const res = await apiRequest("POST", "/api/vendors", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor added successfully" });
      setIsAddVendorOpen(false);
      vendorForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to add vendor", variant: "destructive" });
    },
  });

  const addCouponMutation = useMutation({
    mutationFn: async (data: CouponData) => {
      const res = await apiRequest("POST", "/api/coupons", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Coupon created successfully" });
      setIsAddCouponOpen(false);
      couponForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create coupon", variant: "destructive" });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: UserData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User added successfully" });
      setIsAddUserOpen(false);
      userForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to add user", variant: "destructive" });
    },
  });

  const updateDisputeMutation = useMutation({
    mutationFn: async ({ disputeId, status, adminNotes }: { disputeId: string; status: string; adminNotes?: string }) => {
      const res = await apiRequest("PUT", `/api/disputes/${disputeId}`, { 
        status, 
        adminNotes,
        resolvedAt: status === "resolved" ? new Date().toISOString() : undefined 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      toast({ title: "Dispute updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update dispute", variant: "destructive" });
    },
  });

  const openDisputes = disputes.filter(dispute => dispute.status === "open");
  const recentOrders = orders.slice(0, 10);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-gray-500",
      confirmed: "bg-blue-500",
      preparing: "bg-yellow-500",
      ready: "bg-orange-500",
      picked_up: "bg-purple-500",
      in_transit: "bg-blue-600",
      delivered: "bg-green-500",
      cancelled: "bg-red-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getDisputePriorityColor = (priority: string) => {
    const colors = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-red-500"
    };
    return colors[priority as keyof typeof colors] || "bg-gray-500";
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalVendors || 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+8% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Bike className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+15% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(parseFloat(stats?.totalRevenue || "0") / 100000).toFixed(1)}L</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+22% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Disputes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.openDisputes || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
                  alt="Modern analytics dashboard interface"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">89%</div>
                    <div className="text-sm text-gray-600">Order Completion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">4.7</div>
                    <div className="text-sm text-gray-600">Average Platform Rating</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-500">25 min</div>
                    <div className="text-sm text-gray-600">Average Delivery Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Platform Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Platform Activity</CardTitle>
                  <Button variant="outline" size="sm">View All Orders</Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent orders</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Order ID</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Amount</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-100">
                            <td className="py-3 text-sm">#{order.orderNumber}</td>
                            <td className="py-3 text-sm">Customer</td>
                            <td className="py-3 text-sm font-semibold">₹{order.totalAmount}</td>
                            <td className="py-3">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vendor Management</CardTitle>
                  <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Onboard Vendor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Vendor</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={vendorForm.handleSubmit((data) => addVendorMutation.mutate(data))} className="space-y-4">
                        <div>
                          <Label htmlFor="userId">User ID</Label>
                          <Input {...vendorForm.register("userId")} placeholder="User ID of the vendor account" />
                        </div>
                        
                        <div>
                          <Label htmlFor="shopName">Shop Name</Label>
                          <Input {...vendorForm.register("shopName")} placeholder="Enter shop name" />
                        </div>
                        
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input {...vendorForm.register("category")} placeholder="e.g., Groceries, Electronics" />
                        </div>
                        
                        <div>
                          <Label htmlFor="shopDescription">Description</Label>
                          <Textarea {...vendorForm.register("shopDescription")} placeholder="Shop description" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Input {...vendorForm.register("address")} placeholder="Shop address" />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input {...vendorForm.register("city")} placeholder="City" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="feeStatus">Fee Status</Label>
                          <Select onValueChange={(value) => vendorForm.setValue("feeStatus", value as any)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fee status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={addVendorMutation.isPending}>
                          {addVendorMutation.isPending ? "Adding..." : "Add Vendor"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {vendors.slice(0, 4).map((vendor) => (
                    <div key={vendor.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                      <img 
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150" 
                        alt={vendor.shopName}
                        className="w-full h-24 object-cover rounded-lg mb-3"
                      />
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{vendor.shopName}</h3>
                          <p className="text-sm text-gray-600">{vendor.category}</p>
                        </div>
                        <Badge className={vendor.feeStatus === "paid" ? "bg-green-500" : "bg-yellow-500"}>
                          {vendor.feeStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Fee Status: {vendor.feeStatus}</span>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dispute Queue */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dispute Queue</CardTitle>
                  <Badge className="bg-red-500 text-white">{openDisputes.length} Open</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {openDisputes.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No open disputes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {openDisputes.slice(0, 3).map((dispute) => (
                      <div key={dispute.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm">{dispute.title}</div>
                            <div className="text-xs text-gray-600">{dispute.description}</div>
                          </div>
                          <Badge className={getDisputePriorityColor(dispute.priority)}>
                            {dispute.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateDisputeMutation.mutate({
                                disputeId: dispute.id,
                                status: "investigating",
                                adminNotes: "Investigation started by admin"
                              });
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => setIsAddVendorOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Onboard Vendor
                  </Button>
                  
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Bike className="h-4 w-4 mr-2" />
                        Add Delivery Personnel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Delivery Personnel</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={userForm.handleSubmit((data) => addUserMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input {...userForm.register("fullName")} placeholder="Full name" />
                          </div>
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input {...userForm.register("username")} placeholder="Username" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input {...userForm.register("email")} type="email" placeholder="Email" />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input {...userForm.register("phone")} placeholder="Phone number" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input {...userForm.register("city")} placeholder="City" />
                          </div>
                          <div>
                            <Label htmlFor="password">Password</Label>
                            <Input {...userForm.register("password")} type="password" placeholder="Password" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input {...userForm.register("address")} placeholder="Address" />
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={addUserMutation.isPending}>
                          {addUserMutation.isPending ? "Adding..." : "Add Delivery Personnel"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Ticket className="h-4 w-4 mr-2" />
                        Create Coupon
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Coupon</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={couponForm.handleSubmit((data) => addCouponMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input {...couponForm.register("code")} placeholder="SAVE20" />
                          </div>
                          <div>
                            <Label htmlFor="discountType">Discount Type</Label>
                            <Select onValueChange={(value) => couponForm.setValue("discountType", value as any)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input {...couponForm.register("description")} placeholder="Coupon description" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="discountValue">Discount Value</Label>
                            <Input {...couponForm.register("discountValue")} type="number" step="0.01" />
                          </div>
                          <div>
                            <Label htmlFor="minOrderAmount">Min Order Amount</Label>
                            <Input {...couponForm.register("minOrderAmount")} type="number" step="0.01" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="validFrom">Valid From</Label>
                            <Input {...couponForm.register("validFrom")} type="date" />
                          </div>
                          <div>
                            <Label htmlFor="validUntil">Valid Until</Label>
                            <Input {...couponForm.register("validUntil")} type="date" />
                          </div>
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={addCouponMutation.isPending}>
                          {addCouponMutation.isPending ? "Creating..." : "Create Coupon"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-500">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-500">Healthy</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Gateway</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-500">Maintenance</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Chat</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-500">Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Growth */}
            <Card className="bg-gradient-to-br from-primary to-emerald-700 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Platform Growth</h3>
                <p className="text-sm opacity-90 mb-4">Monthly growth statistics</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>New Users</span>
                    <span className="font-semibold">+2,350</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>New Vendors</span>
                    <span className="font-semibold">+89</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Orders Growth</span>
                    <span className="font-semibold">+18%</span>
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
