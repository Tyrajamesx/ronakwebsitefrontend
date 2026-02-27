import React, { useState, useEffect } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
    const menuItems = [
    { name: "Home", link: "/" },
    { name: "Blockchain", link: "https://www.bnbchain.org/en/bnb-smart-chain" },
    { name: "Tokens", link: "https://www.bnbchain.org/en/solutions/tokenization/rwa-real-world-assets" },
    { name: "Validators", link: "https://docs.bnbchain.org/bnb-smart-chain/validator/create-val" },
    { name: "NFTs", link: "https://www.binance.com/en-IN/nft/home" },
    { name: "Developers", link: "https://developers.binance.com/en" }
  ];
useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 20) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  window.addEventListener("scroll", handleScroll);


  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  return (
<header className="sticky top-0 z-50">
<nav
  className={`fixed top-0 left-0 right-0 z-50 h-[65px] transition-all duration-300

  ${
    scrolled
      ? "bg-black shadow-[0_4px_20px_rgba(234,179,8,0.15)]"
      : "bg-black/80 backdrop-blur-sm"
  }`}
>
        
        {/* Bottom Border */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/10"></div>

        <div className="container mx-auto px-2 sm:px-6 lg:px-8 h-full flex items-center justify-between">

          {/* Logo */}
<a
  href="/"
  onClick={(e) => {
    e.preventDefault();

    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsOpen(false);
  }}
  className="flex items-center gap-0"
>
  <img
    src="/bnb.png"
    alt="BNB Logo"
    className="w-[42px] h-[42px] object-contain"
  />
  <span className="text-[22px] font-black tracking-[0.02em] uppercase text-[#F0B90B]">
    BINANCE
  </span>
</a>



          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10 ml-auto">

        <a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}
  className="text-gray-400 hover:text-white font-medium text-lg transition duration-200"
>
  Home
</a>


            <a
              href="https://www.bnbchain.org/en/bnb-smart-chain"
className="text-gray-400 hover:text-white font-medium text-lg transition duration-200"

>
              Blockchain
            </a>

            <a
              href="https://www.bnbchain.org/en/solutions/tokenization/rwa-real-world-assets"
className="text-gray-400 hover:text-white font-medium text-lg transition duration-200"

>
              Tokens
            </a>

            <a
              href="https://docs.bnbchain.org/bnb-smart-chain/validator/create-val"
className="text-gray-400 hover:text-white font-medium text-lg transition duration-200"

>
              Validators
            </a>

            <a
              href="https://www.binance.com/en-IN/nft/home"
className="text-gray-400 hover:text-white font-medium text-lg transition duration-200"

>
              NFTs
            </a>

            <a
              href="https://developers.binance.com/en"
className="text-gray-400 hover:text-white font-medium text-lg transition duration-200"
>
              Developers
            </a>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="md:hidden p-1.5 text-white hover:text-yellow-400 transition-all duration-200 rounded-md"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              viewBox="0 0 512 512"
              className="w-7 h-7"
              fill="currentColor"
            >
              <path d="M32 96v64h448V96H32zm0 128v64h448v-64H32zm0 128v64h448v-64H32z"></path>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-md z-40 transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-6">
          <div className="flex flex-col space-y-0">

          {menuItems.map((item, index) => (
  <a
    key={index}
    href={item.name === "Home" ? "/" : item.link}
    onClick={(e) => {
      if (item.name === "Home") {
  e.preventDefault();
  if (window.location.pathname !== "/") {
    window.history.pushState({}, "", "/");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

      setIsOpen(false);
    }}
    className="block py-4 text-xl text-gray-300 hover:bg-gradient-to-r hover:bg-clip-text hover:text-transparent hover:from-yellow-400 hover:via-orange-400 hover:to-amber-500 border-b border-gray-800/50 font-medium transition-all duration-200"
  >
    {item.name}
  </a>
))}



          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
