"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/store/useCart";
import { useChat } from "@/store/useChat";

interface PaymentRecord {
  id: string;
  orderId?: string;
  amount: number;
  type?: 'advance' | 'full' | 'remaining';
  paymentType?: 'advance' | 'full' | 'remaining';
  transactionId?: string;
  paymentDate: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
}

interface Order {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  size: string;
  gsm: string;
  quantity: number;
  addOns: string[];
  notes: string;
  total: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  deliveryDate?: string;
  status: 'pending' | 'processing' | 'ready' | 'delivered';
  pickupScheduled?: string;
  paymentStatus?: 'pending' | 'partially_paid' | 'paid' | 'failed';
  advancePaid?: number;
  remainingAmount?: number;
  paymentHistory?: PaymentRecord[];
  files?: string[];
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [status, setStatus] = useState<Order['status']>('pending');
  const [showPaymentHistory, setShowPaymentHistory] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const { items } = useCart();
  const { open: openChat } = useChat();

  useEffect(() => {
    // Load orders from API
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        const result = await response.json();
        if (result.success) {
          // Ensure unique IDs by creating a map
          const uniqueOrders = new Map();
          result.data.forEach((order: Order) => {
            if (!uniqueOrders.has(order.id)) {
              uniqueOrders.set(order.id, order);
            }
          });
          setOrders(Array.from(uniqueOrders.values()));
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
        // Fallback to localStorage if API fails
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          // Ensure unique IDs for localStorage data as well
          const uniqueOrders = new Map();
          orders.forEach((order: Order) => {
            if (!uniqueOrders.has(order.id)) {
              uniqueOrders.set(order.id, order);
            }
          });
          setOrders(Array.from(uniqueOrders.values()));
        }
      }
    };
    
    loadOrders();
  }, []);

  useEffect(() => {
    // Apply filters when orders or filter criteria change
    let filtered = [...orders];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Filter by month
    if (filterMonth) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return (orderDate.getMonth() + 1).toString() === filterMonth;
      });
    }

    // Filter by year
    if (filterYear) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.getFullYear().toString() === filterYear;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, filterStatus, filterMonth, filterYear]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterMonth('');
    setFilterYear('');
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrdersSelection = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const deleteSelectedOrders = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete all selected orders
      const deletePromises = selectedOrders.map(orderId => 
        fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' })
      );
      
      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(res => res.json()));
      
      // Check if any deletions failed
      const failedDeletions = results.filter(result => !result.success);
      if (failedDeletions.length > 0) {
        console.error('Some deletions failed:', failedDeletions);
        alert(`${failedDeletions.length} order(s) could not be deleted.`);
      }
      
      // Update local state
      const updatedOrders = orders.filter(order => !selectedOrders.includes(order.id));
      setOrders(updatedOrders);
      setSelectedOrders([]);
      
      alert(`${selectedOrders.length - failedDeletions.length} order(s) deleted successfully!`);
    } catch (error) {
      console.error('Delete orders error:', error);
      alert('Failed to delete orders. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Login failed');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
  };

  const updateOrderStatus = async (orderId: string, updates: Partial<Order>) => {
    try {
      console.log('Updating order:', orderId, updates);
      
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: orderId, ...updates }),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!result.success) {
        console.error('API error:', result.error);
        throw new Error(result.error || 'Failed to update order');
      }

      // Update local state
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      );
      setOrders(updatedOrders);
      setSelectedOrder(null);
      setDeliveryDate('');
      setPickupTime('');
      
      alert('Order updated successfully!');
    } catch (error) {
      console.error('Update order error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to update order: ${errorMessage}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete order');
      }

      // Update local state
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setDeliveryDate('');
        setPickupTime('');
      }
      
      alert('Order deleted successfully!');
    } catch (error) {
      console.error('Delete order error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete order: ${errorMessage}`);
    }
  };

  // Calculate monthly earnings
  const calculateMonthlyEarnings = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const totalEarnings = monthlyOrders.reduce((sum, order) => {
      const paidAmount = order.advancePaid || (order.paymentStatus === 'paid' ? order.total : 0);
      return sum + paidAmount;
    }, 0);

    const pendingAmount = monthlyOrders.reduce((sum, order) => {
      const remaining = order.remainingAmount || (order.paymentStatus === 'pending' ? order.total : 0);
      return sum + remaining;
    }, 0);

    const orderCount = monthlyOrders.length;

    return {
      month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalEarnings,
      pendingAmount,
      orderCount,
      potentialTotal: totalEarnings + pendingAmount
    };
  };

  const monthlyStats = calculateMonthlyEarnings();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8">
            Admin Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Enter admin email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-2xl hover:shadow-lg transition"
            >
              Login
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-600">
            <p>Demo credentials:</p>
            <p>Email: {ADMIN_EMAIL}</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Monthly Earnings Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-600">Monthly Earnings</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-green-700">₹{monthlyStats.totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">{monthlyStats.month}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-yellow-600">Pending Amount</h3>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700">₹{monthlyStats.pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-yellow-600 mt-1">Yet to be collected</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-600">Total Orders</h3>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{monthlyStats.orderCount}</p>
            <p className="text-xs text-blue-600 mt-1">This month</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-600">Potential Total</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">₹{monthlyStats.potentialTotal.toLocaleString()}</p>
            <p className="text-xs text-purple-600 mt-1">All payments collected</p>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Orders Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Customer Orders</h2>
              <div className="text-sm text-slate-600">
                Total: {orders.length} orders
              </div>
            </div>
            <div className="mb-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">All Months</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">All Years</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Customer Orders</h2>
                {selectedOrders.length > 0 && (
                  <button
                    onClick={deleteSelectedOrders}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    Delete Selected ({selectedOrders.length})
                  </button>
                )}
              </div>
              <div className="text-sm text-slate-600 mt-2">
                Total: {orders.length} orders {filteredOrders.length !== orders.length && `(Showing ${filteredOrders.length} filtered)`}
              </div>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={toggleAllOrdersSelection}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Service</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Payment Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Order Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-900">{order.id}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{order.customerName}</p>
                            <p className="text-sm text-slate-600">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-900">{order.serviceTitle}</td>
                        <td className="py-3 px-4 text-slate-900">₹{order.total.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus || 'pending')}`}>
                            {order.paymentStatus || 'pending'}
                          </span>
                          {order.advancePaid && (
                            <p className="text-xs text-slate-600 mt-1">
                              Paid: ₹{order.advancePaid.toLocaleString()}
                              {order.remainingAmount && order.remainingAmount > 0 && 
                                ` / Remaining: ₹${order.remainingAmount.toLocaleString()}`
                              }
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setDeliveryDate(order.deliveryDate || '');
                                setPickupTime(order.pickupScheduled || '');
                                setStatus(order.status);
                              }}
                              className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition text-sm"
                            >
                              Update
                            </button>
                            {order.files && order.files.length > 0 && (
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                View Uploads ({order.files.length})
                              </button>
                            )}
                            <button
                              onClick={() => setShowPaymentHistory(order)}
                              className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition text-sm"
                            >
                              View Payment History
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Order Update Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Update Order</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Order ID</label>
                    <p className="text-slate-900 font-medium">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                    <p className="text-slate-900">{selectedOrder.customerName} ({selectedOrder.customerEmail})</p>
                  </div>
                  {selectedOrder.files && selectedOrder.files.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Uploaded Files</label>
                      <div className="space-y-2">
                        {selectedOrder.files.map((file, index) => (
                          <div key={index} className="border border-slate-200 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-slate-900 truncate flex-1">{file}</p>
                              <button
                                onClick={() => {
                                  // Open the actual uploaded file in a new tab
                                  window.open(file, '_blank');
                                }}
                                className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                View
                              </button>
                            </div>
                            {file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <div className="mt-2">
                                <div className="relative w-full h-32 bg-slate-100 rounded-lg overflow-hidden">
                                  <img
                                    src={file}
                                    alt={`Uploaded file ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // If image fails to load, show placeholder
                                      const target = e.target as HTMLImageElement;
                                      target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI0MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2YjcyODAiPuKAkDxEZU1PIEZJTEU8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiPihGaWxlIG5vdCBmb3VuZCk8L3RleHQ+PHJlY3QgeD0iMTAlIiB5PSI3NSUiIHdpZHRoPSI4MCUiIGhlaWdodD0iMiIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==";
                                      target.className = "w-full h-full object-cover opacity-75";
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium text-slate-600">
                                    {file.split('/').pop()}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Order['status'])}
                      className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="ready">Ready for Pickup</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Time</label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g., 10:00 AM - 12:00 PM"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, {
                        status,
                        deliveryDate,
                        pickupScheduled: pickupTime
                      })}
                      className="flex-1 bg-green-600 text-white py-3 rounded-2xl hover:bg-green-700 transition"
                    >
                      Update Order
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setDeliveryDate('');
                        setPickupTime('');
                      }}
                      className="flex-1 bg-slate-600 text-white py-3 rounded-2xl hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment History Modal */}
          {showPaymentHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Payment History</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Order ID</label>
                    <p className="text-slate-900 font-medium">{showPaymentHistory.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                    <p className="text-slate-900">{showPaymentHistory.customerName} ({showPaymentHistory.customerEmail})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Total Amount</label>
                    <p className="text-slate-900 font-medium">₹{showPaymentHistory.total.toLocaleString()}</p>
                    <div className="text-xs text-slate-500 mt-1">
                      Debug: advancePaid={showPaymentHistory.advancePaid}, remainingAmount={showPaymentHistory.remainingAmount}, paymentHistoryLength={showPaymentHistory.paymentHistory?.length || 0}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Advance Paid</label>
                      <p className="text-slate-900 font-medium">₹{(() => {
                        // Try payment history first, then fallback to stored advancePaid
                        if (showPaymentHistory.paymentHistory && showPaymentHistory.paymentHistory.length > 0) {
                          // Check for full payment first
                          const fullPayments = showPaymentHistory.paymentHistory.filter(p => 
                            p.type === 'full' || p.paymentType === 'full'
                          );
                          if (fullPayments.length > 0) {
                            // If there's a full payment, advance paid is the full amount
                            const fullTotal = fullPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                            return fullTotal.toLocaleString();
                          }
                          
                          // Otherwise look for advance payments
                          const advancePayments = showPaymentHistory.paymentHistory.filter(p => 
                            p.type === 'advance' || p.paymentType === 'advance'
                          );
                          const advanceTotal = advancePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                          if (advanceTotal > 0) {
                            return advanceTotal.toLocaleString();
                          }
                          
                          // If no advance or full payments, sum all payments as advance
                          const totalPaid = showPaymentHistory.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
                          if (totalPaid > 0) {
                            return totalPaid.toLocaleString();
                          }
                        }
                        // Fallback to stored advancePaid if no payment history or no payments found
                        const storedAdvance = showPaymentHistory.advancePaid || 0;
                        return storedAdvance.toLocaleString();
                      })()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Remaining Amount</label>
                      <p className="text-slate-900 font-medium">₹{(() => {
                        // Try payment history first
                        if (showPaymentHistory.paymentHistory && showPaymentHistory.paymentHistory.length > 0) {
                          const totalPaid = showPaymentHistory.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
                          const remaining = showPaymentHistory.total - totalPaid;
                          return Math.max(0, remaining).toLocaleString();
                        }
                        // Fallback to stored remainingAmount if no payment history
                        const storedRemaining = showPaymentHistory.remainingAmount || 0;
                        if (storedRemaining > 0) {
                          return Math.max(0, storedRemaining).toLocaleString();
                        }
                        // Calculate from advancePaid if available
                        const storedAdvance = showPaymentHistory.advancePaid || 0;
                        if (storedAdvance > 0) {
                          const remaining = showPaymentHistory.total - storedAdvance;
                          return Math.max(0, remaining).toLocaleString();
                        }
                        // Default to total amount if no payment info
                        return showPaymentHistory.total.toLocaleString();
                      })()}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Records</label>
                    {showPaymentHistory.paymentHistory && showPaymentHistory.paymentHistory.length > 0 ? (
                      <div className="space-y-2">
                        {showPaymentHistory.paymentHistory.map((payment, index) => (
                          <div key={index} className="border border-slate-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {payment.paymentType === 'advance' ? 'Advance Payment' : payment.paymentType === 'full' ? 'Full Payment' : 'Remaining Payment'}
                                </p>
                                <p className="text-sm text-slate-600">
                                  Date: {new Date(payment.paymentDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-slate-600">
                                  Method: {payment.paymentMethod || 'N/A'}
                                </p>
                                {payment.transactionId && (
                                  <p className="text-sm text-slate-600">
                                    Transaction ID: {payment.transactionId}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-slate-900">₹{payment.amount.toLocaleString()}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {payment.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600">No payment records found</p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowPaymentHistory(null)}
                      className="flex-1 bg-slate-600 text-white py-3 rounded-2xl hover:bg-slate-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat with Customer */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Customer Communication</h2>
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">Chat with customers about their orders</p>
              <button
                onClick={openChat}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition"
              >
                Open Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}