# E-Click A2Z Solutions - Demo Credentials

## Demo Login Credentials

### Admin Panel
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Administrator
- **Access:** Complete platform management, user management, analytics

### Vendor Panel  
- **Username:** `vendor1`
- **Password:** `vendor123`
- **Role:** Vendor/Shop Owner
- **Access:** Product catalog management, order management, shop settings

### Delivery Personnel Panel
- **Username:** `delivery1`
- **Password:** `delivery123`
- **Role:** Delivery Driver
- **Access:** Order assignments, delivery tracking, earnings

### Customer Panel
- **Username:** `customer1`
- **Password:** `customer123`
- **Role:** Customer/User
- **Access:** Browse products, place orders, track deliveries, chat

## Dashboard Access

All dashboards are accessible through the same login page at `/auth`. After logging in with the respective credentials above, users will be automatically redirected to their role-specific dashboard:

- **Admin Dashboard:** `/admin-dashboard`
- **Vendor Dashboard:** `/vendor-dashboard`  
- **Delivery Dashboard:** `/delivery-dashboard`
- **User Dashboard:** `/user-dashboard`

## Direct Dashboard Links

When running the application locally:

- Login Page: http://localhost:5000/auth
- Landing Page: http://localhost:5000/

After logging in, you'll be automatically redirected to the appropriate dashboard based on your user role.

## Testing Instructions

1. Go to http://localhost:5000/auth
2. Use any of the demo credentials above to login
3. Explore the role-specific features in each dashboard
4. Test features like order placement, chat, product management, etc.
5. Logout and login with different roles to see different perspectives

## Key Features to Test

- **Authentication:** Login/logout with different roles
- **Role-based Access:** Each role sees different dashboards and features
- **Order Management:** Place orders as customer, manage as vendor/admin
- **Real-time Chat:** Communication between different user types
- **Product Management:** Add/edit products as vendor
- **User Management:** Manage all users as admin
- **Delivery Tracking:** Track and update delivery status