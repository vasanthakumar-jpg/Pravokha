import { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/ui/Tooltip";
import { Toaster } from "@/ui/Toaster";
import { AuthProvider, useAuth } from "@/core/context/AuthContext";
import { AdminProvider } from "@/core/context/AdminContext";
import { CartProvider } from "@/core/context/CartContext";
import { Navbar } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import { CartDrawer } from "@/feat/cart/components/CartDrawer";

import { ProtectedRoute } from "@/shared/ui/ProtectedRoute";
import { RoleBasedRedirect } from "@/shared/ui/RoleBasedRedirect";
import { AuthLoadingGuard } from "@/shared/ui/AuthLoadingGuard";
import AdminLayout from "@/layout/AdminLayout";
import SellerLayout from "@/layout/SellerLayout";
import AccountLayout from "@/layout/AccountLayout";

// Simple loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

// Lazy load pages for better performance
const Index = lazy(() => import("./feat/home/pages/HomePage"));
const Products = lazy(() => import("./feat/products/pages/ProductsPage"));
const ProductDetail = lazy(() => import("./feat/products/pages/ProductDetailPage"));
const Checkout = lazy(() => import("./feat/checkout/pages/CheckoutPage"));
const Auth = lazy(() => import("./feat/auth/pages/AuthEnhancedPage"));
const Support = lazy(() => import("./feat/support/pages/SupportPage"));
const Contact = lazy(() => import("./feat/support/pages/ContactPage"));
const FAQ = lazy(() => import("./feat/support/pages/FAQPage"));
const SizeGuide = lazy(() => import("./feat/info/pages/SizeGuidePage"));
const ShippingReturns = lazy(() => import("./feat/info/pages/ShippingReturnsPage"));
const Wishlist = lazy(() => import("./feat/user/pages/WishlistPage"));
const ResetPassword = lazy(() => import("./feat/auth/pages/ResetPasswordPage"));
const LearnMore = lazy(() => import("./feat/info/pages/LearnMorePage"));
const OrderHistory = lazy(() => import("./feat/orders/pages/OrderHistory"));
const NotFound = lazy(() => import("./feat/system/pages/NotFoundPage"));
const ForgotPassword = lazy(() => import("./feat/auth/pages/ForgotPasswordPage"));
const About = lazy(() => import("./feat/info/pages/AboutPage/AboutPage"));
const PolicyPage = lazy(() => import("./feat/info/pages/PolicyPage/PolicyPage"));

// Payment pages
const PaymentSuccess = lazy(() => import("./feat/checkout/pages/PaymentSuccessPage"));
const PaymentFailed = lazy(() => import("./feat/checkout/pages/PaymentFailedPage"));

const EditProduct = lazy(() => import("./feat/admin/pages/EditProduct"));
const AdminProductsManagement = lazy(() => import("./feat/admin/pages/AdminProductsManagement"));
const AdminOrderTracking = lazy(() => import("./feat/admin/pages/AdminOrderTracking"));
const AdminCategories = lazy(() => import("./feat/admin/pages/AdminCategories"));
const AdminSubcategories = lazy(() => import("./feat/admin/pages/AdminSubcategories"));
const AdminAuditLogs = lazy(() => import("./feat/admin/pages/AdminAuditLogs"));
const AdminSupport = lazy(() => import("./feat/admin/pages/AdminSupport"));
const SupportChat = lazy(() => import("./feat/support/pages/SupportChatPage"));
const AdminCustomers = lazy(() => import("./feat/admin/pages/AdminCustomers"));
const AdminAnalytics = lazy(() => import("./feat/admin/pages/AdminAnalytics"));
const AdminComboOffers = lazy(() => import("./feat/admin/pages/AdminComboOffers"));
const Profile = lazy(() => import("./feat/user/pages/ProfilePage"));

// New admin pages
const SuperAdminDashboard = lazy(() => import("./feat/admin/pages/SuperAdminDashboard/SuperAdminDashboard"));
const StaffDashboard = lazy(() => import("./feat/admin/pages/StaffDashboard/StaffDashboard"));
const StaffSettings = lazy(() => import("./feat/admin/pages/StaffSettings/StaffSettings"));

const AdminUsers = lazy(() => import("./feat/admin/pages/AdminUsers"));
const AdminSellers = lazy(() => import("./feat/admin/pages/AdminSellers"));
const AdminPayments = lazy(() => import("./feat/admin/pages/AdminPayments"));
const AdminReports = lazy(() => import("./feat/admin/pages/AdminReports"));
const AdminSettings = lazy(() => import("./feat/admin/pages/AdminSettings"));
const AdminMessages = lazy(() => import("./feat/admin/pages/AdminMessages"));
const AdminReviews = lazy(() => import("./feat/admin/pages/AdminReviews"));
const AdminRoleManagement = lazy(() => import("./feat/admin/pages/AdminRoleManagement"));
const AdminPermissions = lazy(() => import("./feat/admin/pages/AdminPermissionsPage")); // Add this
// const AdminAuditLogs = lazy(() => import("./feat/admin/pages/AdminAuditLogs"));

// Unified Orders Page (for both Admin and Seller)
const UnifiedOrdersPage = lazy(() => import("./feat/orders/pages/UnifiedOrdersPage"));

// Seller pages
const SellerDashboard = lazy(() => import("./feat/seller/pages/SellerDashboard"));
const SellerProducts = lazy(() => import("./feat/seller/pages/SellerProducts"));
const SellerOrders = lazy(() => import("./feat/seller/pages/SellerOrders"));
const SellerOrderDetail = lazy(() => import("./feat/seller/pages/SellerOrderDetail"));
const SellerAnalytics = lazy(() => import("./feat/seller/pages/SellerAnalytics"));
const SellerPayouts = lazy(() => import("./feat/seller/pages/SellerPayouts"));
const SellerPromotions = lazy(() => import("./feat/seller/pages/SellerPromotions"));
const SellerSettings = lazy(() => import("./feat/seller/pages/SellerSettings"));

const AdminProductForm = lazy(() => import("./feat/admin/pages/AdminProductForm"));
const SellerProductForm = lazy(() => import("./feat/seller/pages/SellerProductForm"));
const SellerMessages = lazy(() => import("./feat/seller/pages/SellerMessages"));

// User pages
const UserAccount = lazy(() => import("./feat/user/pages/UserAccount"));
const UserDashboard = lazy(() => import("./feat/user/pages/UserDashboard"));
const UserMessages = lazy(() => import("./feat/user/pages/UserMessages"));

const UserSettings = lazy(() => import("./feat/user/pages/UserSettings/UserSettingsPage"));
const AddressManagement = lazy(() => import("./feat/user/pages/AddressManagement/AddressManagementPage"));
const UserOrderDetail = lazy(() => import("./feat/user/pages/UserOrderDetail"));
const AccessDenied = lazy(() => import("./feat/system/pages/AccessDeniedPage"));

// Ticket System pages
const SupportTickets = lazy(() => import("./feat/support/pages/SupportTicketsPage"));
const TicketDetail = lazy(() => import("./feat/support/pages/TicketDetailPage"));
const AdminTickets = lazy(() => import("./feat/admin/pages/AdminTickets"));
const AdminProductUpdates = lazy(() => import("./feat/admin/pages/AdminProductUpdates"));
const AdminSuspendedSellerTickets = lazy(() => import("./feat/admin/pages/AdminSuspendedSellerTickets"));
const TicketFormPage = lazy(() => import("@/shared/ui/TicketForm"));

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
  const hideFooterRoutes = ["/admin"]; // Enabled for /seller

  // Don't show footer on admin routes
  if (hideFooterRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return <Footer />;
};

const NavigateToOrderDetail = () => {
  const { orderId } = useParams();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const targetPath = isAdmin
    ? `/admin/orders/${orderId}`
    : `/user/orders/detail/${orderId}`;

  return <Navigate to={targetPath} replace />;
};

// Internal Router to dispatch Admin to correct Dashboard
const AdminDashboardRouter = () => {
  const { role } = useAuth();
  if (role === 'SUPER_ADMIN') return <Navigate to="/admin/super-dashboard" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/staff-dashboard" replace />;
  return <Navigate to="/unauthorized" replace />;
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

                          <Route path="/payment/success" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <PaymentSuccess />
                            </Suspense>
                          } />
                          <Route path="/payment/failed" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <PaymentFailed />
                            </Suspense>
                          } />

                          <Route path="/auth" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Auth />
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
                          <Route path="/profile" element={<Navigate to="/user/account/profile" replace />} />
                          <Route path="/faq" element={<Suspense fallback={<LoadingFallback />}><FAQ /></Suspense>} />
                          <Route path="/size-guide" element={<Suspense fallback={<LoadingFallback />}><SizeGuide /></Suspense>} />
                          <Route path="/shipping-returns" element={<Suspense fallback={<LoadingFallback />}><ShippingReturns /></Suspense>} />
                          <Route path="/wishlist" element={<Suspense fallback={<LoadingFallback />}><Wishlist /></Suspense>} />
                          <Route path="/learn-more" element={<Suspense fallback={<LoadingFallback />}><LearnMore /></Suspense>} />

                          {/* Static Information Pages */}
                          <Route path="/about" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <About />
                            </Suspense>
                          } />
                          <Route path="/privacy" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="privacy" /></Suspense>} />
                          <Route path="/terms" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="terms" /></Suspense>} />
                          <Route path="/security" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="security" /></Suspense>} />
                          <Route path="/cancellation-returns" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="cancellation" /></Suspense>} />
                          <Route path="/careers" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="careers" /></Suspense>} />
                          <Route path="/stories" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="stories" /></Suspense>} />
                          <Route path="/press" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="press" /></Suspense>} />
                          <Route path="/corporate" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="corporate" /></Suspense>} />
                          <Route path="/sitemap" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="sitemap" /></Suspense>} />
                          <Route path="/grievance" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="grievance" /></Suspense>} />
                          <Route path="/epr" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="epr" /></Suspense>} />
                          <Route path="/report-infringement" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="infringement" /></Suspense>} />
                          <Route path="/payments-info" element={<Suspense fallback={<LoadingFallback />}><PolicyPage type="payments" /></Suspense>} />
                          <Route path="/orders" element={<Navigate to="/user/orders" replace />} />
                          <Route path="/orders/:orderId" element={<NavigateToOrderDetail />} />
                          <Route path="/settings" element={<Navigate to="/user/account/settings" replace />} />
                          <Route path="/account" element={<Navigate to="/user/account" replace />} />
                          <Route path="/payments" element={<Navigate to="/user/account/settings" replace />} />

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

                          <Route path="/support-chat/:conversationId?" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <SupportChat />
                            </Suspense>
                          } />

                          {/* Admin Routes */}
                          <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                              <AdminLayout />
                            </ProtectedRoute>
                          }>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={
                              <AdminDashboardRouter />
                            } />
                            <Route path="super-dashboard" element={
                              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <Suspense fallback={<LoadingFallback />}>
                                  <SuperAdminDashboard />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                            <Route path="staff-dashboard" element={
                              <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                                <Suspense fallback={<LoadingFallback />}>
                                  <StaffDashboard />
                                </Suspense>
                              </ProtectedRoute>
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
                              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <Suspense fallback={<LoadingFallback />}>
                                  <AdminPayments />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                            <Route path="reports" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminReports />
                              </Suspense>
                            } />
                            <Route path="settings" element={
                              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <Suspense fallback={<LoadingFallback />}>
                                  <AdminSettings />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                            <Route path="profile-settings" element={
                              <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                                <Suspense fallback={<LoadingFallback />}>
                                  <StaffSettings />
                                </Suspense>
                              </ProtectedRoute>
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
                              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <Suspense fallback={<LoadingFallback />}>
                                  <AdminRoleManagement />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                            <Route path="roles/:adminId/permissions" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <AdminPermissions />
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
                              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <Suspense fallback={<LoadingFallback />}>
                                  <AdminAuditLogs />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                          </Route>

                          {/* Seller Routes */}
                          <Route path="/seller" element={
                            <ProtectedRoute allowedRoles={["SELLER"]}>
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
                            <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN", "SUPER_ADMIN"]}>
                              <Suspense fallback={<LoadingFallback />}>
                                <Routes>
                                  <Route index element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <UserDashboard />
                                    </Suspense>
                                  } />
                                  <Route path="home" element={<Navigate to="/user" replace />} />
                                  <Route path="account" element={<AccountLayout />}>
                                    <Route index element={
                                      <Suspense fallback={<LoadingFallback />}>
                                        <UserAccount />
                                      </Suspense>
                                    } />
                                    <Route path="profile" element={
                                      <Suspense fallback={<LoadingFallback />}>
                                        <Profile />
                                      </Suspense>
                                    } />
                                    <Route path="addresses" element={
                                      <Suspense fallback={<LoadingFallback />}>
                                        <AddressManagement />
                                      </Suspense>
                                    } />
                                    <Route path="settings" element={
                                      <Suspense fallback={<LoadingFallback />}>
                                        <UserSettings />
                                      </Suspense>
                                    } />
                                  </Route>
                                  <Route path="messages" element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <UserMessages />
                                    </Suspense>
                                  } />
                                  <Route path="orders" element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <OrderHistory />
                                    </Suspense>
                                  } />
                                  <Route path="orders/:status" element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <OrderHistory />
                                    </Suspense>
                                  } />
                                  <Route path="orders/detail/:orderId" element={
                                    <Suspense fallback={<LoadingFallback />}>
                                      <UserOrderDetail />
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
                          <Route path="/unauthorized" element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AccessDenied />
                            </Suspense>
                          } />

                          <Route path="/payment/success" element={<PaymentSuccess />} />
                          <Route path="/payment/failed" element={<PaymentFailed />} />
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
