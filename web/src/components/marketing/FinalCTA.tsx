import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-5xl mb-6">🚀</div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Spreman si? Počni danas.
        </h2>
        <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Registracija je besplatna. Za 5 minuta možeš imati prvu ponudu gotovu
          i poslatu klijentu.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/register"
            className="inline-flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-blue-900 transition-colors shadow-lg shadow-blue-200">
            Registruj se besplatno →
          </Link>
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-base hover:border-gray-400 transition-colors">
            Već imam nalog — Prijava
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Besplatna registracija</span>
          <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Bez kreditne kartice</span>
          <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Radi odmah</span>
        </div>
      </div>
    </section>
  )
}
