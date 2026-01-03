import { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { Toaster } from "@/components/ui/Toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { CartProvider } from "@/contexts/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RoleBasedRedirect } from "@/components/common/RoleBasedRedirect";
import { AuthLoadingGuard } from "@/components/common/AuthLoadingGuard";
import AdminLayout from "@/layouts/AdminLayout";
import SellerLayout from "@/layouts/SellerLayout";

// Simple loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

// Lazy load pages for better performance
const Index = lazy(() => import("./features/home/pages/HomePage"));
const Products = lazy(() => import("./features/products/pages/ProductsPage"));
const ProductDetail = lazy(() => import("./features/products/pages/ProductDetailPage"));
const Checkout = lazy(() => import("./features/checkout/pages/CheckoutPage"));
const Auth = lazy(() => import("./features/auth/pages/AuthEnhancedPage"));
const AuthUnified = lazy(() => import("./features/auth/pages/AuthPage"));
const Support = lazy(() => import("./features/support/pages/SupportPage"));
const Contact = lazy(() => import("./features/support/pages/ContactPage"));
const FAQ = lazy(() => import("./features/support/pages/FAQPage"));
const SizeGuide = lazy(() => import("./features/info/pages/SizeGuidePage"));
const ShippingReturns = lazy(() => import("./features/info/pages/ShippingReturnsPage"));
const Wishlist = lazy(() => import("./features/user/pages/WishlistPage"));
const ResetPassword = lazy(() => import("./features/auth/pages/ResetPasswordPage"));
const LearnMore = lazy(() => import("./features/info/pages/LearnMorePage"));
const OrderHistory = lazy(() => import("./features/orders/pages/OrderHistory"));
const NotFound = lazy(() => import("./features/system/pages/NotFoundPage"));
const ForgotPassword = lazy(() => import("./features/auth/pages/ForgotPasswordPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./features/admin/pages/AdminOrders"));
const AdminProducts = lazy(() => import("./features/admin/pages/AdminProducts"));

const EditProduct = lazy(() => import("./features/admin/pages/EditProduct"));
const AdminProductsManagement = lazy(() => import("./features/admin/pages/AdminProductsManagement"));
const AdminOrderTracking = lazy(() => import("./features/admin/pages/AdminOrderTracking"));
const AdminCategories = lazy(() => import("./features/admin/pages/AdminCategories"));
const AdminSubcategories = lazy(() => import("./features/admin/pages/AdminSubcategories"));
const AdminAuditLogs = lazy(() => import("./features/admin/pages/AdminAuditLogs"));
const AdminSupport = lazy(() => import("./features/admin/pages/AdminSupport"));
const SupportChat = lazy(() => import("./features/support/pages/SupportChatPage"));
const AdminCustomers = lazy(() => import("./features/admin/pages/AdminCustomers"));
const AdminAnalytics = lazy(() => import("./features/admin/pages/AdminAnalytics"));
const AdminComboOffers = lazy(() => import("./features/admin/pages/AdminComboOffers"));
const Profile = lazy(() => import("./features/user/pages/ProfilePage"));

// New admin pages
const AdminUsers = lazy(() => import("./features/admin/pages/AdminUsers"));
const AdminSellers = lazy(() => import("./features/admin/pages/AdminSellers"));
const AdminPayments = lazy(() => import("./features/admin/pages/AdminPayments"));
const AdminReports = lazy(() => import("./features/admin/pages/AdminReports"));
const AdminSettings = lazy(() => import("./features/admin/pages/AdminSettings"));
const AdminMessages = lazy(() => import("./features/admin/pages/AdminMessages"));
const AdminReviews = lazy(() => import("./features/admin/pages/AdminReviews"));
const AdminRoleManagement = lazy(() => import("./features/admin/pages/AdminRoleManagement"));
// const AdminAuditLogs = lazy(() => import("./features/admin/pages/AdminAuditLogs"));

// Unified Orders Page (for both Admin and Seller)
const UnifiedOrdersPage = lazy(() => import("./features/orders/pages/UnifiedOrdersPage"));

// Seller pages
const SellerDashboard = lazy(() => import("./features/seller/pages/SellerDashboard"));
const SellerProducts = lazy(() => import("./features/seller/pages/SellerProducts"));
const SellerOrders = lazy(() => import("./features/seller/pages/SellerOrders"));
const SellerOrderDetail = lazy(() => import("./features/seller/pages/SellerOrderDetail"));
const SellerAnalytics = lazy(() => import("./features/seller/pages/SellerAnalytics"));
const SellerPayouts = lazy(() => import("./features/seller/pages/SellerPayouts"));
const SellerPromotions = lazy(() => import("./features/seller/pages/SellerPromotions"));
const SellerSettings = lazy(() => import("./features/seller/pages/SellerSettings"));

const AdminProductForm = lazy(() => import("./features/admin/pages/AdminProductForm"));
const SellerProductForm = lazy(() => import("./features/seller/pages/SellerProductForm"));
const SellerMessages = lazy(() => import("./features/seller/pages/SellerMessages"));

// User pages
const UserAccount = lazy(() => import("./features/user/pages/UserAccount"));
const UserDashboard = lazy(() => import("./features/user/pages/UserDashboard"));
const UserMessages = lazy(() => import("./features/user/pages/UserMessages"));

const UserSettings = lazy(() => import("./features/user/pages/UserSettings"));
const UserOrderDetail = lazy(() => import("./features/user/pages/UserOrderDetail"));
const AccessDenied = lazy(() => import("./features/system/pages/AccessDeniedPage"));

// Ticket System pages
const SupportTickets = lazy(() => import("./features/support/pages/SupportTicketsPage"));
const TicketDetail = lazy(() => import("./features/support/pages/TicketDetailPage"));
const AdminTickets = lazy(() => import("./features/admin/pages/AdminTickets"));
const AdminProductUpdates = lazy(() => import("./features/admin/pages/AdminProductUpdates"));
const AdminSuspendedSellerTickets = lazy(() => import("./features/admin/pages/AdminSuspendedSellerTickets"));
const TicketFormPage = lazy(() => import("@/components/common/TicketForm"));

const queryClient = new QueryClient();



// Conditional Navbar - only show on routes that don't have their own layout
const ConditionalNavbar = () => {
  const location = useLocation();
  const hideNavbarRoutes = ["/admin", "/seller"];

  // Don't show navbar on admin or seller routes
  if (hideNavbarRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return <Navbar />;
};

// Conditional Footer - only show on routes that don't have their own layout
const ConditionalFooter = () => {
  const location = useLocation();
  const hideFooterRoutes = ["/admin", "/seller"];

  // Don't show footer on admin or seller routes
  if (hideFooterRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return <Footer />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <AuthProvider>
            <AdminProvider>
              <CartProvider>
                <AuthLoadingGuard>
                  <div className="flex flex-col min-h-screen">
                    <ConditionalNavbar />
                    <main className="flex-1">
                      <Suspense fallback={<LoadingFallback />}>
                        <RoleBasedRedirect />
                        <Routes>
                          <Route path="/" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Index />
                            </Suspense>
                          } />
                          <Route path="/products" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Products />
                            </Suspense>
                          } />
                          <Route path="/product/:slug" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <ProductDetail />
                            </Suspense>
                          } />
                          <Route path="/checkout" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Checkout />
                            </Suspense>
                          } />
                          <Route path="/auth" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AuthUnified />
                            </Suspense>
                          } />
                          <Route path="/auth-enhanced" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Auth />
                            </Suspense>
                          } />
                          <Route path="/forgot-password" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <ForgotPassword />
                            </Suspense>
                          } />
                          <Route path="/reset-password" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <ResetPassword />
                            </Suspense>
                          } />
                          <Route path="/support" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Support />
                            </Suspense>
                          } />
                          <Route path="/contact" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Contact />
                            </Suspense>
                          } />
                          <Route path="/profile" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Profile />
                            </Suspense>
                          } />
                          <Route path="/faq" element={<FAQ />} />
                          <Route path="/size-guide" element={<SizeGuide />} />
                          <Route path="/shipping-returns" element={<ShippingReturns />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/learn-more" element={<LearnMore />} />
                          <Route path="/orders" element={<OrderHistory />} />
                          <Route path="/orders/:orderId" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <UserOrderDetail />
                            </Suspense>
                          } />
                          <Route path="/settings" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <UserSettings />
                            </Suspense>
                          } />
                          <Route path="/account" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <UserSettings />
                            </Suspense>
                          } />
                          <Route path="/payments" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <UserSettings />
                            </Suspense>
                          } />

                          {/* Ticket System Routes */}
                          <Route path="/tickets" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <SupportTickets />
                            </Suspense>
                          } />
                          <Route path="/tickets/new" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <div className="container mx-auto p-6 max-w-3xl">
                                <TicketFormPage />
                              </div>
                            </Suspense>
                          } />
                          <Route path="/tickets/:id" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <TicketDetail />
                            </Suspense>
                          } />

                          <Route path="/support-chat/:conversationId?" element={<SupportChat />} />

                          {/* Admin Routes */}
                          <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminLayout />
                            </ProtectedRoute>
                          }>
                            <Route index element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminDashboard />
                              </Suspense>
                            } />
                            <Route path="analytics" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminAnalytics />
                              </Suspense>
                            } />
                            <Route path="orders" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <UnifiedOrdersPage />
                              </Suspense>
                            } />
                            <Route path="orders/:orderId" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerOrderDetail />
                              </Suspense>
                            } />
                            <Route path="orders/tracking" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminOrderTracking />
                              </Suspense>
                            } />
                            <Route path="products/add" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminProductForm />
                              </Suspense>
                            } />
                            <Route path="products/edit/:id" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminProductForm />
                              </Suspense>
                            } />
                            <Route path="products/manage" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminProductsManagement />
                              </Suspense>
                            } />
                            <Route path="products/updates" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminProductUpdates />
                              </Suspense>
                            } />
                            <Route path="customers" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminCustomers />
                              </Suspense>
                            } />
                            <Route path="users" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminUsers />
                              </Suspense>
                            } />
                            <Route path="sellers" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminSellers />
                              </Suspense>
                            } />
                            <Route path="payments" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminPayments />
                              </Suspense>
                            } />
                            <Route path="reports" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminReports />
                              </Suspense>
                            } />
                            <Route path="settings" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminSettings />
                              </Suspense>
                            } />
                            <Route path="tickets" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminTickets />
                              </Suspense>
                            } />
                            <Route path="tickets/:id" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <TicketDetail />
                              </Suspense>
                            } />
                            <Route path="tickets/suspended" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminSuspendedSellerTickets />
                              </Suspense>
                            } />
                            <Route path="roles" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminRoleManagement />
                              </Suspense>
                            } />
                            <Route path="categories" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminCategories />
                              </Suspense>
                            } />
                            <Route path="subcategories" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminSubcategories />
                              </Suspense>
                            } />
                            <Route path="combo-offers" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminComboOffers />
                              </Suspense>
                            } />
                            <Route path="support" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminSupport />
                              </Suspense>
                            } />
                            <Route path="messages" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminMessages />
                              </Suspense>
                            } />
                            <Route path="audit-logs" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminAuditLogs />
                              </Suspense>
                            } />
                          </Route>

                          {/* Seller Routes */}
                          <Route path="/seller" element={
                            <ProtectedRoute allowedRoles={["seller"]}>
                              <SellerLayout />
                            </ProtectedRoute>
                          }>
                            <Route index element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerDashboard />
                              </Suspense>
                            } />
                            <Route path="dashboard" element={<Navigate to="/seller" replace />} />
                            <Route path="products/add" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerProductForm />
                              </Suspense>
                            } />
                            <Route path="products/edit/:id" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerProductForm />
                              </Suspense>
                            } />
                            <Route path="products" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerProducts />
                              </Suspense>
                            } />
                            <Route path="my-products" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerProducts />
                              </Suspense>
                            } />
                            <Route path="orders" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <UnifiedOrdersPage />
                              </Suspense>
                            } />
                            <Route path="orders/:orderId" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerOrderDetail />
                              </Suspense>
                            } />
                            <Route path="analytics" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerAnalytics />
                              </Suspense>
                            } />
                            <Route path="payouts" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerPayouts />
                              </Suspense>
                            } />
                            <Route path="promotions" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerPromotions />
                              </Suspense>
                            } />
                            <Route path="settings" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerSettings />
                              </Suspense>
                            } />
                            <Route path="messages" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SellerMessages />
                              </Suspense>
                            } />
                          </Route>

                          {/* User Routes */}
                          <Route path="/user/*" element={
                            <ProtectedRoute allowedRoles={["user"]}>
                              <Suspense fallback={<LoadingFallback />}>
                                <Routes>
                                  <Route index element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <UserDashboard />
                                    </Suspense>
                                  } />
                                  <Route path="home" element={<Navigate to="/user" replace />} />
                                  <Route path="account" element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <UserAccount />
                                    </Suspense>
                                  } />
                                  <Route path="messages" element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <UserMessages />
                                    </Suspense>
                                  } />
                                </Routes>
                              </Suspense>
                            </ProtectedRoute>
                          } />

                          {/* Access Denied Route */}
                          <Route path="/access-denied" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AccessDenied />
                            </Suspense>
                          } />

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </main>
                    <ConditionalFooter />
                    <CartDrawer />
                  </div>
                </AuthLoadingGuard>
                <Toaster />
              </CartProvider>
            </AdminProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
