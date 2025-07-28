import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Users, Store, Bike, TrendingUp, Star, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "For Users",
    description: "Browse multiple vendors, track orders in real-time, and enjoy seamless delivery experience",
    color: "bg-primary"
  },
  {
    icon: Store,
    title: "For Vendors", 
    description: "Manage your catalog, track orders, and grow your business with our comprehensive dashboard",
    color: "bg-accent"
  },
  {
    icon: Bike,
    title: "For Delivery Partners",
    description: "Flexible work hours, real-time navigation, and transparent earning system",
    color: "bg-success"
  }
];

const stats = [
  { value: "1000+", label: "Active Vendors" },
  { value: "50K+", label: "Happy Customers" },
  { value: "500+", label: "Delivery Partners" },
  { value: "100K+", label: "Orders Delivered" }
];

const benefits = [
  {
    icon: Clock,
    title: "Fast Delivery",
    description: "Average delivery time of 25 minutes"
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "End-to-end security for all transactions"
  },
  {
    icon: Star,
    title: "Quality Assured",
    description: "4.7 average platform rating"
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-emerald-700 text-white py-20">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1565043666747-69f6646db940?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
          className="absolute inset-0"
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Ek Click A2Z Solutions
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Your One-Stop Multi-Vendor Delivery Platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold">
                  Start Shopping
                </Button>
              </Link>
              <Link href="/auth">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold"
                >
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose E-Click?</h2>
            <p className="text-lg text-gray-600">Complete delivery solutions for everyone</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Benefits</h2>
            <p className="text-lg text-gray-600">Experience the difference with our premium service</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers and vendors on our platform
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">E-Click A2Z</span>
              </div>
              <p className="text-gray-400">Your trusted multi-vendor delivery platform</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Users</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Browse Vendors</li>
                <li>Track Orders</li>
                <li>Customer Support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Partners</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Become a Vendor</li>
                <li>Delivery Partner</li>
                <li>Business Solutions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 E-Click A2Z Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
