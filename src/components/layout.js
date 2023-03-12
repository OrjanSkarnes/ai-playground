// components/layout.js
import Navbar from '@/components/Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className='layout-wrapper'>
      <Navbar />
      <main className='main-content'>{children}</main>
      <Footer />
    </div>
  )
}