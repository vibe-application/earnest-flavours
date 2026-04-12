import { ExternalLink } from 'lucide-react';
import metadata from '@/data/metadata.json';

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-muted/20 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-heading text-base font-semibold text-foreground/80">
              Earnest Flavors
            </p>
            <p className="max-w-2xl leading-relaxed">
              Fan-made and unofficial. Flavor availability can change through the day, so please confirm with your local Earnest shop before making the trip.
            </p>

            <a
              href={metadata.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Source: earnesticecream.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <a
            href="https://www.buymeacoffee.com/kavankfc4"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline md:self-auto"
          >
            Support this fan project
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
