'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  shipped: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  RETURNED: 'bg-orange-100 text-orange-800',
  returned: 'bg-orange-100 text-orange-800',
  REFUND_REQUESTED: 'bg-pink-100 text-pink-800',
  refund_requested: 'bg-pink-100 text-pink-800',
};

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Refund
  const [refundAmount, setRefundAmount] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  // Tracking form
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingData, setTrackingData] = useState({
    carrier: '',
    trackingNumber: '',
    estimatedDelivery: '',
  });
  const [trackingSubmitting, setTrackingSubmitting] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await api.orders.getById(id, token || undefined);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('Failed to load order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    try {
      setStatusUpdating(true);
      const token = await getToken();
      await api.orders.updateStatus(id, newStatus, token || undefined);
      await fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingData.carrier || !trackingData.trackingNumber) return;

    try {
      setTrackingSubmitting(true);
      const token = await getToken();
      await api.orders.addTracking(id, {
        carrier: trackingData.carrier,
        trackingNumber: trackingData.trackingNumber,
        estimatedDelivery: trackingData.estimatedDelivery || undefined,
      }, token || undefined);
      setTrackingData({ carrier: '', trackingNumber: '', estimatedDelivery: '' });
      setShowTrackingForm(false);
      await fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to add tracking');
    } finally {
      setTrackingSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    try {
      setRefundSubmitting(true);
      const token = await getToken();
      const amountCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
      await api.orders.refund(id, amountCents, token || undefined);
      setRefundAmount('');
      setRefundDialogOpen(false);
      await fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setRefundSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading order...</div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div>
        <Button variant="ghost" onClick={() => router.push('/dashboard/orders')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  const shippingAddr = order.shippingAddress;
  const billingAddr = (order as any).billingAddress;
  const shipping = (order as any).shipping;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        <Badge className={statusColors[order.status] || 'bg-muted text-foreground'}>
          {order.status}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-foreground">
                      <div>
                        {item.name || item.productName || item.productId}
                        {(item.variantName || item.attributes) && (
                          <div className="text-muted-foreground text-xs mt-1">
                            {item.variantName || (item.attributes && Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', '))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{formatCurrency(item.price || item.unitPrice)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency((item.price || item.unitPrice) * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shippingAddr && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="text-foreground font-medium">
                    {shippingAddr.firstName} {shippingAddr.lastName}
                  </p>
                  <p>{shippingAddr.street || (shippingAddr as any).address1}</p>
                  {((shippingAddr as any).address2) && <p>{(shippingAddr as any).address2}</p>}
                  <p>
                    {shippingAddr.city}, {shippingAddr.state} {shippingAddr.zipCode}
                  </p>
                  <p>{shippingAddr.country}</p>
                  {shippingAddr.phone && <p>Phone: {shippingAddr.phone}</p>}
                </div>
              </div>
            )}

            {billingAddr && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-3">Billing Address</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="text-foreground font-medium">
                    {billingAddr.firstName} {billingAddr.lastName}
                  </p>
                  <p>{billingAddr.street || billingAddr.address1 }</p>
                  {billingAddr.address2  && <p>{billingAddr.address2 }</p>}
                  <p>
                    {billingAddr.city}, {billingAddr.state} {billingAddr.zipCode}
                  </p>
                  <p>{billingAddr.country}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tracking */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tracking</h2>
              <Button size="sm" variant="outline" onClick={() => setShowTrackingForm(!showTrackingForm)}>
                {showTrackingForm ? 'Cancel' : 'Add Tracking'}
              </Button>
            </div>

            {showTrackingForm && (
              <form onSubmit={handleAddTracking} className="space-y-3 mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Carrier *</label>
                    <Select
                      value={trackingData.carrier}
                      onValueChange={(v) => setTrackingData(d => ({ ...d, carrier: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USPS">USPS</SelectItem>
                        <SelectItem value="FedEx">FedEx</SelectItem>
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Tracking Number *</label>
                    <Input
                      value={trackingData.trackingNumber}
                      onChange={(e) => setTrackingData(d => ({ ...d, trackingNumber: e.target.value }))}
                      placeholder="1Z999AA1..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Est. Delivery</label>
                    <Input
                      type="date"
                      value={trackingData.estimatedDelivery}
                      onChange={(e) => setTrackingData(d => ({ ...d, estimatedDelivery: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={trackingSubmitting || !trackingData.carrier || !trackingData.trackingNumber}>
                  {trackingSubmitting ? 'Adding...' : 'Mark as Shipped'}
                </Button>
              </form>
            )}

            {shipping?.trackingNumber ? (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Carrier:</span> {shipping.carrier}</p>
                <p><span className="font-medium text-foreground">Tracking #:</span> <span className="font-mono bg-muted px-2 py-1 rounded">{shipping.trackingNumber}</span></p>
                {shipping.shippedAt && <p><span className="font-medium text-foreground">Shipped:</span> {formatDate(shipping.shippedAt)}</p>}
                {shipping.estimatedDelivery && <p><span className="font-medium text-foreground">Est. Delivery:</span> {formatDate(shipping.estimatedDelivery)}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tracking information available.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Status</h2>
            <Select
              value={order.status}
              onValueChange={handleStatusChange}
              disabled={statusUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="refund_requested">Refund Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order Summary */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency((order as any).subtotalAmount || (order as any).subtotal || 0)}</span>
              </div>
              {((order as any).shippingAmount || (order as any).shippingCost) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency((order as any).shippingAmount || (order as any).shippingCost)}</span>
                </div>
              )}
              {(order as any).taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency((order as any).taxAmount)}</span>
                </div>
              )}
              {(order as any).discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency((order as any).discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {(order as any).payment && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-3">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="capitalize">{(order as any).payment.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={
                    (order as any).payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                    (order as any).payment.status === 'refunded' ? 'bg-red-100 text-red-800' :
                    (order as any).payment.status === 'partially_refunded' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {(order as any).payment.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>{formatCurrency((order as any).payment.amount)}</span>
                </div>
                {(order as any).payment.refundedAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refunded</span>
                    <span className="text-red-600">{formatCurrency((order as any).payment.refundedAmount)}</span>
                  </div>
                )}
                {(order as any).payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid At</span>
                    <span>{formatDate((order as any).payment.paidAt)}</span>
                  </div>
                )}
              </div>

              {/* Refund button */}
              {(order as any).payment.status === 'succeeded' || (order as any).payment.status === 'partially_refunded' ? (
                <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50">
                      <RefreshCw className="h-4 w-4 mr-2" /> Issue Refund
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Issue Refund</DialogTitle>
                      <DialogDescription>
                        Refund for order {order.orderNumber}. Leave amount empty for a full refund.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="text-sm text-muted-foreground">Refund Amount (USD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={((order as any).payment.amount - (order as any).payment.refundedAmount) / 100}
                        placeholder={`Full refund: $${(((order as any).payment.amount - (order as any).payment.refundedAmount) / 100).toFixed(2)}`}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleRefund}
                        disabled={refundSubmitting}
                      >
                        {refundSubmitting ? 'Processing...' : 'Confirm Refund'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
          )}

          {/* Customer Info */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Customer</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              {order.guestEmail && <p>{order.guestEmail}</p>}
              {order.userId && <p>User ID: {order.userId}</p>}
              <p>Created: {formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
