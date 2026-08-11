'use client';

import { useTranslation } from 'react-i18next';
import type { Order } from '@repo/types';

interface TrackingSectionProps {
  order: Order;
}

const carrierTrackingUrls: Record<string, (tn: string) => string> = {
  USPS: (tn) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`,
  FedEx: (tn) => `https://www.fedex.com/fedextrack/?trknbr=${tn}`,
  UPS: (tn) => `https://www.ups.com/track?tracknum=${tn}`,
  DHL: (tn) => `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`,
};

export default function TrackingSection({ order }: TrackingSectionProps) {
  const { t, i18n } = useTranslation('profile');

  if (!order.shipping?.trackingNumber) {
    return null;
  }

  const { carrier, trackingNumber, shippedAt, estimatedDelivery } = order.shipping;
  const trackingUrl = carrier && carrierTrackingUrls[carrier];

  const locale = i18n.language === 'uk' ? 'uk-UA' : 'pl-PL';
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-utility-warning-50 text-utility-warning-700',
      PAID: 'bg-utility-success-50 text-utility-success-700',
      PROCESSING: 'bg-utility-brand-50 text-utility-brand-700',
      SHIPPED: 'bg-utility-purple-50 text-utility-purple-700',
      DELIVERED: 'bg-utility-success-50 text-utility-success-700',
      CANCELLED: 'bg-utility-error-50 text-utility-error-700',
      RETURNED: 'bg-utility-orange-50 text-utility-orange-700',
      REFUND_REQUESTED: 'bg-utility-pink-50 text-utility-pink-700',
    };
    return colors[status] || 'bg-secondary_subtle text-primary';
  };

  return (
    <div className="border border-border-secondary rounded-lg p-6 bg-primary shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{t('tracking.title')}</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-tertiary">{t('tracking.status')}</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
            {t(`orders.status.${order.status}`, { defaultValue: order.status })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-tertiary">{t('tracking.carrier')}</span>
          <span className="font-medium">{carrier}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-tertiary">{t('tracking.trackingNumber')}</span>
          <span className="font-mono text-sm bg-secondary_subtle px-3 py-2 rounded break-all">
            {trackingNumber}
          </span>
        </div>

        {trackingUrl && (
          <div className="pt-2">
            <a
              href={trackingUrl(trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full text-center bg-brand-solid text-white py-2 px-4 rounded-md hover:bg-brand-solid_hover transition-colors"
            >
              {t('tracking.trackPackage')}
            </a>
          </div>
        )}

        {shippedAt && (
          <div className="flex items-center justify-between pt-2 border-t border-border-secondary">
            <span className="text-tertiary">{t('tracking.shipped')}</span>
            <span className="font-medium">{formatDate(shippedAt)}</span>
          </div>
        )}

        {estimatedDelivery && (
          <div className="flex items-center justify-between">
            <span className="text-tertiary">{t('tracking.estimatedDelivery')}</span>
            <span className="font-medium">{formatDate(estimatedDelivery)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
