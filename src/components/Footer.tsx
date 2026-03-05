export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Über das Projekt</h3>
            <p className="text-sm">
              TTS Dialektannotations-Plattform
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>
            <p className="text-sm">
                            <a href="mailto:huberfa4@students.zhaw.ch" className="hover:text-white transition-colors">
                huberfa4@students.zhaw.ch
              </a>
              <br></br>
              <a href="mailto:hueneach@students.zhaw.ch" className="hover:text-white transition-colors">
                hueneach@students.zhaw.ch
              </a>

            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
