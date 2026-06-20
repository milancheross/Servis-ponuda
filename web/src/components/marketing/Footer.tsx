import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#1e3a8a] rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">SP</span>
              </div>
              <span className="font-bold text-white text-lg">Servis Ponuda</span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed">
              Ponude, fakture i klijenti za majstore i servisne firme — na jednom mestu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <div className="font-semibold text-gray-300 mb-2 col-span-2 md:col-span-1">Aplikacija</div>
            <Link href="/register" className="hover:text-white transition-colors">Registracija</Link>
            <Link href="/login" className="hover:text-white transition-colors">Prijava</Link>
            <a href="#kako-radi" className="hover:text-white transition-colors">Kako radi</a>
            <a href="#cene" className="hover:text-white transition-colors">Cene</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#funkcionalnosti" className="hover:text-white transition-colors">Funkcionalnosti</a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <span>© {new Date().getFullYear()} Servis Ponuda. Sva prava zadržana.</span>
          <div className="flex gap-5">
            <span className="cursor-default hover:text-white transition-colors">Politika privatnosti</span>
            <span className="cursor-default hover:text-white transition-colors">Uslovi korišćenja</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
