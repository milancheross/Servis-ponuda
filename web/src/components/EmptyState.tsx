export default function EmptyState({ icon, title, message }: { icon: string; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="text-gray-700 font-semibold text-lg mb-1">{title}</div>
      {message && <div className="text-gray-400 text-sm">{message}</div>}
    </div>
  )
}
