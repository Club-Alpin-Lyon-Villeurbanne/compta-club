import AuthProvider from './AuthProvider'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import './globals.css'

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
    <html lang="en">
      <body className="font-sans antialiased bg-gray-200">
        <AuthProvider>
          <Navbar />
          <div className="pt-20">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
