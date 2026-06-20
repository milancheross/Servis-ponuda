const MOBILE_POINTS = [
  { icon: '🚐', text: 'Kreiraj ponudu iz komija dok si kod klijenta' },
  { icon: '📍', text: 'Pošalji link odmah nakon obilaska' },
  { icon: '🔔', text: 'Vidi kada je klijent otvorio ponudu' },
  { icon: '✅', text: 'Prihvati ili odbij — bez papira' },
]

export default function MobileSection() {
  return (
    <section className="py-16 md:py-24 bg-[#1e3a8a] px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
          <div className="md:flex-1 text-white">
            <div className="inline-flex items-center gap-2 bg-blue-800 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              📱 Mobile-first dizajn
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              Radi sa telefona, sa terena, odmah
            </h2>
            <p className="text-blue-200 text-lg leading-relaxed mb-8">
              Servis Ponuda nije desktop kancelarijski alat. Dizajniran je da radi na telefonu —
              jer ti ne sediš za računarom dok radiš posao.
            </p>
            <ul className="space-y-4">
              {MOBILE_POINTS.map(p => (
                <li key={p.text} className="flex items-center gap-4">
                  <span className="text-2xl w-10 shrink-0">{p.icon}</span>
                  <span className="text-blue-100">{p.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:flex-1 flex justify-center">
            <div className="w-64 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
              <div className="bg-[#1e3a8a] px-5 pt-4 pb-3">
                <div className="text-white text-xs font-semibold text-center mb-2">Servis Ponuda</div>
              </div>
              <div className="p-4 space-y-3 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1e3a8a] rounded-xl p-3">
                    <div className="text-white text-xl font-bold">12</div>
                    <div className="text-blue-200 text-xs">Klijenata</div>
                  </div>
                  <div className="bg-[#1e3a8a] rounded-xl p-3">
                    <div className="text-white text-xl font-bold">4</div>
                    <div className="text-blue-200 text-xs">Ovaj mesec</div>
                  </div>
                </div>
                {[
                  { name: 'Zoran Đorđević', num: 'SP-2024-012', status: 'Prihvaćena', color: 'bg-green-100 text-green-700' },
                  { name: 'Maja Stanković', num: 'SP-2024-011', status: 'Poslata', color: 'bg-blue-100 text-blue-700' },
                  { name: 'Igor Milić', num: 'SP-2024-010', status: 'Nacrt', color: 'bg-gray-100 text-gray-600' },
                ].map(q => (
                  <div key={q.num} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{q.name}</div>
                        <div className="text-xs text-gray-400">{q.num}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${q.color}`}>{q.status}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <div className="w-12 h-12 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xl shadow-lg">+</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
