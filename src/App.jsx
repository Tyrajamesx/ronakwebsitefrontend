import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dark mode is forced, but we can keep the class for consistency
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} /> 

      <main>
        <Hero />
      </main>


      
    </div>
  );
}

export default App;
