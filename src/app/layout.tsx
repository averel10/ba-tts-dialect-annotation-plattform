import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AudioProvider } from '@/components/AudioProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body className="flex flex-col min-h-screen">
        <AudioProvider>
          <Header />
          <main className="flex-grow mt-4 mb-4 mr-8 ml-8">
            {children}
          </main>
          <Footer />
        </AudioProvider>
      </body>
    </html>
  )
}