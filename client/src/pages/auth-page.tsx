import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { TrendingUp, Shield, Clock, Users } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  shopName: z.string().optional(),
  shopDescription: z.string().optional(),
  category: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      fullName: "",
      phone: "",
      role: "user",
      address: "",
      city: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          setLocation("/admin");
          break;
        case "vendor":
          setLocation("/vendor");
          break;
        case "delivery":
          setLocation("/delivery");
          break;
        default:
          setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const onLogin = async (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = async (data: RegisterData) => {
    const { confirmPassword, shopName, shopDescription, category, ...userData } = data;
    registerMutation.mutate(userData);
  };

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Column - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">E-Click A2Z</span>
            </div>
            <p className="text-gray-600">Welcome to your delivery platform</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        {...loginForm.register("username")}
                        placeholder="Enter your username"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        {...loginForm.register("password")}
                        type="password"
                        placeholder="Enter your password"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          {...registerForm.register("fullName")}
                          placeholder="John Doe"
                        />
                        {registerForm.formState.errors.fullName && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          {...registerForm.register("username")}
                          placeholder="johndoe"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        {...registerForm.register("email")}
                        type="email"
                        placeholder="john@example.com"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        {...registerForm.register("phone")}
                        placeholder="+91 9876543210"
                      />
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="role">Account Type</Label>
                      <Select onValueChange={(value) => registerForm.setValue("role", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Customer</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="delivery">Delivery Partner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          {...registerForm.register("city")}
                          placeholder="Delhi"
                        />
                      </div>

                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          {...registerForm.register("address")}
                          placeholder="Street address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          {...registerForm.register("password")}
                          type="password"
                          placeholder="Enter password"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          {...registerForm.register("confirmPassword")}
                          type="password"
                          placeholder="Confirm password"
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-emerald-700 text-white">
        <div className="flex flex-col justify-center p-12">
          <h2 className="text-4xl font-bold mb-6">
            Join the E-Click Community
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Connect with thousands of vendors and customers in your city. 
            Experience seamless delivery services like never before.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Fast Delivery</h3>
                <p className="opacity-90">Average delivery time of 25 minutes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Platform</h3>
                <p className="opacity-90">End-to-end security for all transactions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Trusted Community</h3>
                <p className="opacity-90">50,000+ satisfied customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
