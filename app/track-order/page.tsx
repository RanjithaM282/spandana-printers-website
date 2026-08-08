'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Order } from '@/lib/database';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleDeliveryOptionSelect = (option: 'pickup' | 'delivery') => {
    if (order) {
      setOrder({ ...order, deliveryOption: option });
    }
  };

  // Auto-fill from URL parameters
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const emailParam = searchParams.get('email');
    
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
    if (emailParam) {
      setEmail(emailParam);
    }
    
    // Auto-search if both parameters are present
    if (orderIdParam && emailParam) {
      handleTrackOrder(orderIdParam, emailParam);
    }
  }, [searchParams]);

  const handleTrackOrder = async (orderIdToSearch?: string, emailToSearch?: string) => {
    const searchOrderId = orderIdToSearch || orderId;
    const searchEmail = emailToSearch || email;
    
    if (!searchOrderId || !searchEmail) {
      setError('Please enter both Order ID and Email');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch(`/api/orders?orderId=${encodeURIComponent(searchOrderId)}&email=${encodeURIComponent(searchEmail)}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Order not found');
        setOrder(null);
      } else {
        setOrder(result.data);
        setError('');
      }
    } catch (err) {
      setError('Failed to track order. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'ready': return 'text-green-600 bg-green-50';
      case 'delivered': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-red-600 bg-red-50';
      case 'partially_paid': return 'text-yellow-600 bg-yellow-50';
      case 'paid': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
            Track Your Order
          </h1>
          <p className="text-lg text-slate-600">
            Enter your order details to track your printing order status
          </p>
        </div>

        <div className="rounded-3xl bg-white shadow-2xl p-8">
          {/* Search Form */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., order-1731234567890"
                className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleTrackOrder()}
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Order Details</h2>
                
                {/* Order Status Cards */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <h3 className="text-sm font-medium text-slate-600 mb-1">Order Status</h3>
                    <p className={`text-lg font-semibold capitalize ${getStatusColor(order.status)} px-3 py-1 rounded-lg inline-block`}>
                      {order.status}
                    </p>
                  </div>
                  
                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <h3 className="text-sm font-medium text-slate-600 mb-1">Payment Status</h3>
                    <p className={`text-lg font-semibold capitalize ${getPaymentStatusColor(order.paymentStatus || 'pending')} px-3 py-1 rounded-lg inline-block`}>
                      {order.paymentStatus || 'pending'}
                    </p>
                  </div>
                </div>

                {/* Order Information */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Service</h3>
                      <p className="text-slate-900 font-semibold">{order.serviceTitle}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Order ID</h3>
                      <p className="text-slate-900 font-mono text-sm">{order.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Size & GSM</h3>
                      <p className="text-slate-900">{order.size} • {order.gsm} GSM</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Quantity</h3>
                      <p className="text-slate-900">{order.quantity?.toLocaleString() || '0'} units</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Order Date</h3>
                      <p className="text-slate-900">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Total Amount</h3>
                      <p className="text-slate-900 font-bold text-lg">₹{order.total?.toLocaleString() || '0'}</p>
                    </div>
                  </div>

                  {order.deliveryDate && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Expected Delivery</h3>
                      <p className="text-slate-900">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  {order.pickupScheduled && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Pickup Scheduled</h3>
                      <p className="text-slate-900">{order.pickupScheduled ? new Date(order.pickupScheduled).toLocaleString() : 'Not scheduled'}</p>
                    </div>
                  )}

                  {/* Delivery Option Selection */}
                  {order.status === 'pending' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-600 mb-3">Select Delivery Option</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryOption"
                            value="pickup"
                            className="text-blue-600"
                            onChange={() => handleDeliveryOptionSelect('pickup')}
                          />
                          <span className="text-sm text-slate-700">Store Pickup</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryOption"
                            value="delivery"
                            className="text-blue-600"
                            onChange={() => handleDeliveryOptionSelect('delivery')}
                          />
                          <span className="text-sm text-slate-700">Home Delivery (Additional charges may apply)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {order.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Notes</h3>
                      <p className="text-slate-900">{order.notes}</p>
                    </div>
                  )}

                  {order.addOns && order.addOns.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Add-ons</h3>
                      <div className="flex flex-wrap gap-2">
                        {order.addOns.map((addOn, index) => (
                          <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                            {addOn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Information */}
                {(order.advancePaid !== undefined || order.remainingAmount !== undefined) && (
                  <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {order.advancePaid !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-600 mb-1">Advance Paid</h4>
                          <p className="text-slate-900 font-semibold">₹{(() => {
                            // Try payment history first, then fallback to stored advancePaid
                            if (order.paymentHistory && order.paymentHistory.length > 0) {
                              // Check for full payment first
                              const fullPayments = order.paymentHistory.filter(p => 
                                (p as any).type === 'full' || p.paymentType === 'full'
                              );
                              if (fullPayments.length > 0) {
                                // If there's a full payment, advance paid is the full amount
                                const fullTotal = fullPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                                return fullTotal.toLocaleString();
                              }
                              
                              // Otherwise look for advance payments
                              const advancePayments = order.paymentHistory.filter(p => 
                                (p as any).type === 'advance' || p.paymentType === 'advance'
                              );
                              const advanceTotal = advancePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                              if (advanceTotal > 0) {
                                return advanceTotal.toLocaleString();
                              }
                              
                              // If no advance or full payments, sum all payments as advance
                              const totalPaid = order.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
                              if (totalPaid > 0) {
                                return totalPaid.toLocaleString();
                              }
                            }
                            // Fallback to stored advancePaid if no payment history or no payments found
                            return (order.advancePaid || 0).toLocaleString();
                          })()}</p>
                        </div>
                      )}
                      {order.remainingAmount !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-600 mb-1">Remaining Amount</h4>
                          <p className="text-slate-900 font-semibold">₹{(() => {
                            // Try payment history first
                            if (order.paymentHistory && order.paymentHistory.length > 0) {
                              const totalPaid = order.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
                              const remaining = order.total - totalPaid;
                              return Math.max(0, remaining).toLocaleString();
                            }
                            // Fallback to stored remainingAmount if no payment history
                            const storedRemaining = order.remainingAmount || 0;
                            if (storedRemaining > 0) {
                              return Math.max(0, storedRemaining).toLocaleString();
                            }
                            // Calculate from advancePaid if available
                            const storedAdvance = order.advancePaid || 0;
                            if (storedAdvance > 0) {
                              const remaining = order.total - storedAdvance;
                              return Math.max(0, remaining).toLocaleString();
                            }
                            // Default to total amount if no payment info
                            return order.total.toLocaleString();
                          })()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Results State */}
          {searched && !order && !error && (
            <div className="text-center py-8">
              <p className="text-slate-600">No order found with the provided details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}