const CONFIG: Record<string, { label: string; className: string }> = {
  nacrt:      { label: 'Nacrt',      className: 'bg-gray-100 text-gray-600' },
  poslata:    { label: 'Poslata',    className: 'bg-blue-100 text-blue-700' },
  prihvacena: { label: 'Prihvaćena', className: 'bg-green-100 text-green-700' },
  odbijena:   { label: 'Odbijena',   className: 'bg-red-100 text-red-700' },
  neplaceno:  { label: 'Neplaćeno',  className: 'bg-orange-100 text-orange-700' },
  placeno:    { label: 'Plaćeno',    className: 'bg-green-100 text-green-700' },
}

export default function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const cfg = CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`inline-block rounded-full font-semibold ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
