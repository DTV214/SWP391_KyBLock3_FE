interface VatOrderBadgeProps {
  className?: string;
}

export default function VatOrderBadge({ className = "" }: VatOrderBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-tet-secondary/70 bg-[#FBF5E8] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-tet-primary shadow-sm ${className}`}
    >
      Có hóa đơn VAT
    </span>
  );
}
