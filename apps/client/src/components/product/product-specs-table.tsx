import React from 'react';

interface ProductSpecsTableProps {
  attributes: Record<string, unknown>;
  categoryAttributes?: Array<{ name: string; displayName: string }>;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function ProductSpecsTable({ attributes, categoryAttributes }: ProductSpecsTableProps) {
  const rows = Object.entries(attributes).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-primary mb-4">Specifications</h2>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(([key, value], index) => {
            const catAttr = categoryAttributes?.find((attr) => attr.name === key);
            const displayName = catAttr?.displayName ?? humanizeKey(key);
            const displayValue =
              typeof value === 'object' ? JSON.stringify(value) : String(value);

            return (
              <tr key={key} className={index % 2 === 0 ? 'bg-secondary_subtle' : 'bg-primary'}>
                <td className="py-2 px-4 font-medium text-tertiary w-1/3 border border-border-secondary">
                  {displayName}
                </td>
                <td className="py-2 px-4 text-primary border border-border-secondary">{displayValue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
