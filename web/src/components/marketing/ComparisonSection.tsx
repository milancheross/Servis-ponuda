const ROWS = [
  { feature: 'Kreiranje ponude', viber: 'Ručno, od nule', excel: 'Ručno kopiranje', sp: 'Iz cenovnika, 2 min' },
  { feature: 'Baza klijenata', viber: 'Razbacano', excel: 'Tabela, teško pretraži', sp: 'Kartice, brza pretraga' },
  { feature: 'Praćenje statusa', viber: 'Ne postoji', excel: 'Ručno ažuriranje', sp: 'Automatski' },
  { feature: 'Prihvatanje ponude', viber: 'Dogovor na reč', excel: 'Email, bez potpisa', sp: 'Link + digitalni potpis' },
  { feature: 'Pravljenje fakture', viber: 'Novi dokument', excel: 'Copy-paste', sp: 'Jednim klikom iz ponude' },
  { feature: 'PDF export', viber: 'Ne postoji', excel: 'Osnovno', sp: 'Profesionalni PDF' },
  { feature: 'Pregled neplaćenih', viber: 'Nema', excel: 'Ručno praćenje', sp: 'Dashboard prikaz' },
  { feature: 'Sa telefona', viber: 'Delimično', excel: 'Teško', sp: 'Potpuno' },
]

export default function ComparisonSection() {
  return (
    <section className="py-16 md:py-24 bg-white px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Zašto ne Excel ili Viber?
          </h2>
          <p className="text-gray-600 text-lg">
            Svako rešenje ima svoja ograničenja.
          </p>
        </div>

        <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500">Funkcionalnost</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-500">Viber / Papir</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-500">Excel</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-[#1e3a8a] bg-blue-50">Servis Ponuda</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{row.viber}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{row.excel}</td>
                  <td className="px-6 py-4 text-sm text-center font-semibold text-[#1e3a8a] bg-blue-50/50">{row.sp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {ROWS.map(row => (
            <div key={row.feature} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900 text-sm">{row.feature}</div>
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                <div className="px-3 py-3 text-xs text-gray-500 text-center">
                  <div className="text-gray-400 font-semibold mb-1">Viber/Papir</div>
                  {row.viber}
                </div>
                <div className="px-3 py-3 text-xs text-gray-500 text-center">
                  <div className="text-gray-400 font-semibold mb-1">Excel</div>
                  {row.excel}
                </div>
                <div className="px-3 py-3 text-xs text-[#1e3a8a] font-semibold text-center bg-blue-50">
                  <div className="text-blue-400 font-semibold mb-1">Servis Ponuda</div>
                  {row.sp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
