import './globals.css';
import { Header } from '@/components/Header';
import { AudioProvider } from '@/components/AudioProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <title>TTS Dialektannotation</title>
      <body className="flex flex-col min-h-screen">
        <AudioProvider>
          <Header />
          <main className="flex-grow pt-4 pb-8">
            {children}
          </main>
        </AudioProvider>
      </body>
    </html>
  )
}