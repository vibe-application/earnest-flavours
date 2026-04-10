import { ExternalLink, Heart } from 'lucide-react';
import metadata from '@/data/metadata.json';

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-background/60 sm:flex-row sm:gap-3">
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-marshmallow-pink fill-marshmallow-pink" />
            <span>for ice cream lovers</span>
          </div>
          <span className="hidden text-background/30 sm:inline">|</span>
          <span>
            Data sourced daily from{' '}
            <a
              href={metadata.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline-offset-4 transition-colors hover:text-background hover:underline"
            >
              earnesticecream.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
