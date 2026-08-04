import { Link } from "wouter";
import { ArrowRight, ExternalLink } from "lucide-react";

interface CompactServiceCardProps {
  slug: string;
  title: string;
  description: string;
  image?: string;
  price?: string;
  priceLabel?: string;
  priceNote?: string;
  href: string;
  badge?: string;
  icon?: React.ReactNode;
  external?: boolean;
}

/** Compact card style used for the "Testing & Exam Programs" row — also used for
 *  the main business/testing service grids so all service cards share one look. */
export default function CompactServiceCard({
  slug,
  title,
  description,
  image,
  price,
  priceLabel,
  priceNote,
  href,
  badge,
  icon,
  external,
}: CompactServiceCardProps) {
  const content = (
    <div
      className="group border border-border/50 bg-card rounded-xl overflow-hidden hover-elevate cursor-pointer h-full"
      data-testid={`card-service-${slug}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0D1B3D] to-[#1A237E] flex items-center justify-center">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
                {icon}
              </div>
            )}
          </div>
        )}
        {badge && (
          <div className="absolute top-2 right-2 bg-[#FF6A00] text-[#0D1B3D] rounded-md px-2 py-1 text-xs font-bold shadow-sm">
            {badge}
          </div>
        )}
        {price ? (
          <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm">
            <span className="text-sm font-bold text-[#0D1B3D] dark:text-white">{price}</span>
            {priceLabel && <span className="text-[10px] text-muted-foreground ml-0.5">{priceLabel}</span>}
          </div>
        ) : priceNote ? (
          <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm">
            <span className="text-xs font-semibold text-[#0D1B3D] dark:text-white">{priceNote}</span>
          </div>
        ) : null}
        {external && <ExternalLink className="absolute top-2 right-2 w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-semibold leading-tight" data-testid={`text-service-title-${slug}`}>
            {title}
          </h3>
          {!external && (
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2" data-testid={`text-service-desc-${slug}`}>
          {description}
        </p>
      </div>
    </div>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <Link href={href}>{content}</Link>
  );
}
