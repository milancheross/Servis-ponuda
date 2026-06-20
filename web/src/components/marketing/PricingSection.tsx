import Link from 'next/link'

export default function PricingSection() {
  return (
    <section id="cene" className="py-16 md:py-24 bg-slate-50 px-4 scroll-mt-16">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Jednostavne cene</h2>
          <p className="text-gray-600 text-lg">
            Bez skrivenih troškova, bez ugovora, bez iznenađenja.
          </p>
        </div>

        <div className="bg-[#1e3a8a] text-white rounded-2xl p-8 flex flex-col shadow-xl">
          <div className="inline-block bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">
            30 dana besplatno
          </div>
          <div className="mb-1 font-bold text-xl">Servis Ponuda</div>
          <div className="text-blue-200 text-sm mb-4">Sve funkcionalnosti, bez ograničenja.</div>
          <div className="mt-2 mb-6">
            <span className="text-5xl font-bold">2.000 RSD</span>
            <span className="text-sm ml-2 text-blue-200">/ mesečno</span>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              'Neograničen broj klijenata',
              'Neograničen broj ponuda i faktura',
              'Neograničen cenovnik',
              'Javni link za klijenta sa potpisom',
              'PDF export (ponude i fakture)',
              'Dashboard i statistike',
              'Podrška',
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <span className="text-blue-300">✓</span>
                <span className="text-blue-100">{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="block text-center py-3.5 rounded-xl font-bold text-sm bg-white text-[#1e3a8a] hover:bg-blue-50 transition-colors"
          >
            Isprobaj besplatno 30 dana →
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Cene su u srpskim dinarima i bez PDV-a. Otkaži u bilo kom trenutku.
        </p>
      </div>
    </section>
  )
}
