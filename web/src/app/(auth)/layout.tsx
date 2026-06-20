export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] flex items-center justify-center p-4 py-10">
      {children}
    </div>
  )
}
