import { useTheme } from '@/hooks/useTheme';
import { Navigation } from '@/components/custom/Navigation';
import { CoreFlavors } from '@/sections/CoreFlavors';
import { Footer } from '@/sections/Footer';

function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <Navigation isDark={isDark} toggleTheme={toggleTheme} />

      <main className="flex-1 pt-32 sm:pt-28">
        <CoreFlavors />
      </main>

      <Footer />
    </div>
  );
}

export default App;
