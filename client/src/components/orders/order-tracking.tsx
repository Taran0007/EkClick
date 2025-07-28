import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, User, Phone, Package, Truck } from "lucide-react";
import { format } from "date-fns";

interface OrderTrackingProps {
  orderId: string;
  onClose: () => void;
}

export function OrderTracking({ orderId, onClose }: OrderTrackingProps) {
  const { data: order } = useQuery({
    queryKey: ["/api/orders", orderId],
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["/api/orders", orderId, "items"],
    enabled: !!orderId,
  });

  if (!order) return null;

  const statusSteps = [
    { key: "pending", label: "Order Placed", icon: Package },
    { key: "confirmed", label: "Confirmed", icon: Package },
    { key: "preparing", label: "Preparing", icon: Package },
    { key: "ready", label: "Ready for Pickup", icon: Package },
    { key: "picked_up", label: "Picked Up", icon: Truck },
    { key: "in_transit", label: "In Transit", icon: Truck },
    { key: "delivered", label: "Delivered", icon: Package },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "active";
    return "pending";
  };

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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Track Order #{order.orderNumber}</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Progress */}
          <div className="space-y-4">
            <h3 className="font-semibold">Order Progress</h3>
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const status = getStepStatus(index);
                const StepIcon = step.icon;
                
                return (
                  <div key={step.key} className="flex items-center space-x-4">
                    <div className={`order-progress-step ${status}`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        status === "completed" ? "text-green-600" :
                        status === "active" ? "text-blue-600" :
                        "text-gray-400"
                      }`}>
                        {step.label}
                      </p>
                      {status === "active" && (
                        <p className="text-sm text-gray-500">Current status</p>
                      )}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`order-progress-line ${
                        status === "completed" ? "completed" : ""
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Order Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ordered on</span>
                </div>
                <p className="font-medium">
                  {format(new Date(order.createdAt), "PPp")}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Amount</span>
                </div>
                <p className="font-medium">₹{order.totalAmount}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Delivery Address</span>
            </div>
            <p className="text-gray-600 ml-6">{order.deliveryAddress}</p>
          </div>

          {/* Delivery Person Info (if assigned) */}
          {order.deliveryPersonId && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Delivery Partner</span>
                </div>
                <div className="ml-6 space-y-2">
                  <p className="font-medium">Delivery Partner Assigned</p>
                  <p className="text-sm text-gray-600">Vehicle: Motorcycle</p>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Delivery Partner
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Order Items */}
          {orderItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Order Items</h3>
                <div className="space-y-2">
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">₹{item.totalPrice}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Special Instructions */}
          {order.specialInstructions && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Special Instructions</h3>
                <p className="text-gray-600">{order.specialInstructions}</p>
              </div>
            </>
          )}

          {/* Estimated Delivery Time */}
          {order.estimatedDeliveryTime && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Estimated Delivery</span>
                </div>
                <p className="text-gray-600 ml-6">
                  {format(new Date(order.estimatedDeliveryTime), "PPp")}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
