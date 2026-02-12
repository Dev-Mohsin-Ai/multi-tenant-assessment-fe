import React from 'react'
import HeaderLogo from '../../assets/HeaderLogo.png'

const Header = () => {
  return (
    <header className="fixed top-0 z-30 h-10 w-full border-b border-white/10 bg-[rgb(12,19,34)] text-white shadow-sm">
      <div className="flex h-full items-center justify-between px-3 md:px-5">
        <div className="flex items-center gap-2.5">
          <img src={HeaderLogo} alt="Atlas" className="h-7 w-auto" />
          <div className="text-[15px] font-semibold tracking-wide text-white/95">
            Atlas
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
