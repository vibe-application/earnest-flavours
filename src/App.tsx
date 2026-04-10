import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Navigation } from '@/components/custom/Navigation';
import { CoreFlavors } from '@/sections/CoreFlavors';
import { Footer } from '@/sections/Footer';

function BuyMeACoffeeWidget() {
  useEffect(() => {
    const existingWidget = document.querySelector('script[data-name="BMC-Widget"]');
    if (existingWidget) {
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.async = true;
    script.setAttribute('data-id', 'kavankfc4');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', 'Hopefully it helps, thanks for your appreciation');
    script.setAttribute('data-color', '#FF813F');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');

    document.body.appendChild(script);

    return () => {
      script.remove();
      document.getElementById('bmc-wbtn')?.remove();
      document.getElementById('bmc-iframe')?.remove();
    };
  }, []);

  return null;
}

function BuyMeAnIceCreamFallback() {
  return (
    <a
      href="https://www.buymeacoffee.com/kavankfc4"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[18px] right-[18px] z-50 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#FF813F] px-5 text-sm font-bold text-white shadow-soft-lg transition-transform hover:-translate-y-0.5 hover:bg-[#ff995f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF813F] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span aria-hidden="true">🍨</span>
    </a>
  );
}

function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navigation isDark={isDark} toggleTheme={toggleTheme} />
      <BuyMeACoffeeWidget />
      <BuyMeAnIceCreamFallback />
      
      <main className="pt-16">
        <CoreFlavors />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
