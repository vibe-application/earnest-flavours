import { useTheme } from '@/hooks/useTheme';
import { Navigation } from '@/components/custom/Navigation';
import { CoreFlavors } from '@/sections/CoreFlavors';
import { Footer } from '@/sections/Footer';

function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navigation isDark={isDark} toggleTheme={toggleTheme} />
      
      <main className="pt-16">
        <CoreFlavors />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
