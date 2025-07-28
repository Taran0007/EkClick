import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { ShoppingBag, TrendingUp, Star, Package, Plus, MessageCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const productSchema = insertProductSchema;
type ProductData = z.infer<typeof productSchema>;

export default function VendorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);

  const { data: vendor } = useQuery({
    queryKey: ["/api/vendors", "me"],
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "products"],
    enabled: !!vendor?.id,
  });

  const productForm = useForm<ProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      vendorId: vendor?.id || "",
      name: "",
      description: "",
      category: "",
      price: "0",
      stock: 0,
      imageUrl: "",
      isActive: true,
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductData) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Product added successfully" });
      setIsAddProductOpen(false);
      productForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const todayOrders = orders.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.createdAt).toDateString() === today;
  });

  const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-gray-500",
      confirmed: "bg-blue-500",
      preparing: "bg-yellow-500",
      ready: "bg-green-500",
      picked_up: "bg-purple-500",
      in_transit: "bg-blue-600",
      delivered: "bg-green-600",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const onAddProduct = async (data: ProductData) => {
    if (!vendor?.id) return;
    addProductMutation.mutate({ ...data, vendorId: vendor.id });
  };

  if (!user || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading vendor dashboard...</p>
          {!vendor && user && (
            <p className="text-sm text-gray-500">
              If you're a vendor, please contact admin to set up your vendor profile.
            </p>
          )}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {vendor.shopName} Dashboard
          </h1>
          <p className="text-gray-600">Manage your store and track performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+12% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{todayRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+8% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{vendor.rating || "4.8"}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">{vendor.totalReviews || 0} reviews</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">Active items</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
              </div>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                    <p className="text-sm text-gray-500">Orders will appear here once customers start ordering</p>
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
                        {orders.slice(0, 5).map((order) => (
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const nextStatus = order.status === 'confirmed' ? 'preparing' :
                                                   order.status === 'preparing' ? 'ready' : order.status;
                                  if (nextStatus !== order.status) {
                                    updateOrderMutation.mutate({ orderId: order.id, status: nextStatus });
                                  }
                                }}
                              >
                                Update Status
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

            {/* Product Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Product Catalog</CardTitle>
                  <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={productForm.handleSubmit(onAddProduct)} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Product Name</Label>
                          <Input {...productForm.register("name")} placeholder="Enter product name" />
                        </div>
                        
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input {...productForm.register("category")} placeholder="e.g., Electronics, Groceries" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input {...productForm.register("price")} type="number" step="0.01" />
                          </div>
                          <div>
                            <Label htmlFor="stock">Stock Quantity</Label>
                            <Input 
                              {...productForm.register("stock", { valueAsNumber: true })} 
                              type="number" 
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea {...productForm.register("description")} placeholder="Product description" />
                        </div>
                        
                        <div>
                          <Label htmlFor="imageUrl">Image URL</Label>
                          <Input {...productForm.register("imageUrl")} placeholder="https://example.com/image.jpg" />
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={addProductMutation.isPending}>
                          {addProductMutation.isPending ? "Adding..." : "Add Product"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No products yet</p>
                    <p className="text-sm text-gray-500">Add your first product to get started</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <img 
                          src={product.imageUrl || "https://images.unsplash.com/photo-1506617420156-8e4536971650?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-gray-600">Category: {product.category}</p>
                          </div>
                          <span className="text-lg font-bold text-primary">₹{product.price}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Stock: {product.stock} units</span>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm" className="text-red-600">Delete</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Store Status */}
            <Card>
              <CardHeader>
                <CardTitle>Store Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm">Currently</span>
                  <Badge className={storeOpen ? "bg-green-500" : "bg-red-500"}>
                    {storeOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStoreOpen(!storeOpen)}
                >
                  {storeOpen ? (
                    <>
                      <ToggleRight className="h-4 w-4 mr-2" />
                      Close Store
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      Open Store
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => setIsAddProductOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full">
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customer Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Customer Support</div>
                      <div className="text-xs text-gray-500">No new messages</div>
                      <div className="text-xs text-gray-400">Check back later</div>
                    </div>
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
