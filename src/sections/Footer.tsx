import { Heart, ExternalLink, IceCream } from 'lucide-react';

function BuyMeAnIceCreamButton() {
  return (
    <a
      href="https://www.buymeacoffee.com/kavankfc4"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#FFDD00] px-5 text-base font-bold text-black shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-[#FFE34D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00] focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
    >
      <span aria-hidden="true">🍨</span>
      <span>Buy me an ice-cream</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-background/10">
              <IceCream className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-lg">
              Earnest Flavors
            </span>
          </div>

          {/* Disclaimer */}
          <div className="space-y-2 text-sm text-background/70 max-w-md">
            <p>
              This is an unofficial fan-made website. Not affiliated with Earnest Ice Cream.
            </p>
            <p>
              Data sourced from{' '}
              <a
                href="https://earnesticecream.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-background transition-colors"
              >
                earnesticecream.com
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <p>Last updated: April 9, 2026</p>
          </div>

          {/* Note */}
          <div className="p-4 rounded-xl bg-background/10 text-sm max-w-lg">
            <p className="text-background/80">
              <strong>Note:</strong> Flavors change throughout the day so stores 
              cannot guarantee availability of all flavors listed. Please check 
              with your local shop for current offerings.
            </p>
          </div>

          <BuyMeAnIceCreamButton />

          {/* Made with love */}
          <div className="flex items-center gap-2 text-sm text-background/60 pt-4 border-t border-background/10 w-full justify-center">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-marshmallow-pink fill-marshmallow-pink" />
            <span>for ice cream lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
