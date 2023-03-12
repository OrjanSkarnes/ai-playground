import Link from 'next/link';
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  const linkClicked = () => setIsOpen(false)

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="logo">
          AI Playground
        </Link>
        <button
          className={`toggle-btn ${isOpen ? "open" : ''}`}
          onClick={toggleMenu}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
        <ul className={`menu ${isOpen ? "open" : ''}`}>
          <li>
            <Link href="/summarizepdf" onClick={linkClicked}>Summarize documents / books</Link>
          </li>
          <li>
            <Link href="/salesreport" onClick={linkClicked}>Sales report</Link>
          </li>
          <li>
            <Link href="/articles" onClick={linkClicked}>Articles</Link>
          </li>
          <li>
            <Link href="/images" onClick={linkClicked}>Images</Link>
          </li>
        </ul>
      </div>
    </nav>
  )
};

export default Navbar;
