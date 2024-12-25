
import AuthProvider from '../AuthProvider'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import '../globals.css'

export const metadata = {
  title: 'Gestion des notes de frais du Club Alpin de Lyon',
  description: 'Gestion des notes de frais du Club Alpin de Lyon',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="flex flex-col min-h-screen font-sans antialiased bg-gray-200">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow px-4 pt-20 mt-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}