type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const styles = {
    DRAFT: 'bg-gray-100 text-gray-700 border border-gray-300',
    ACTIVE: 'bg-green-100 text-green-700 border border-green-300',
    ARCHIVED: 'bg-red-100 text-red-700 border border-red-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
