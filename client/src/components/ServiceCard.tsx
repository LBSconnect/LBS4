import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ExternalLink } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  image?: string;
  price?: string;
  priceLabel?: string;
  slug: string;
  href?: string; // overrides the default /services/:slug link
  icon?: React.ReactNode;
  buttonLabel?: string;
  badge?: string; // e.g. "Next: Sat, Jul 19"
}

export default function ServiceCard({
  title,
  description,
  image,
  price,
  priceLabel,
  slug,
  href,
  icon,
  buttonLabel,
  badge,
}: ServiceCardProps) {
  const isExternal = !!href && (href.startsWith("http://") || href.startsWith("https://"));

  return (
    <Card
      className="group border-border/50 bg-card transition-all duration-300 hover-elevate"
      data-testid={`card-service-${slug}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-md">
        {image ? (
          <>
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0D1B3D] to-[#1A237E] flex items-center justify-center">
            {icon ? (
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
                {icon}
              </div>
            ) : null}
          </div>
        )}
        {badge && (
          <div className="absolute top-3 right-3 bg-[#FF6A00] text-[#0D1B3D] rounded-md px-2.5 py-1 text-xs font-bold shadow-sm">
            {badge}
          </div>
        )}
        {price && (
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-md px-3 py-1.5 shadow-sm">
            <span className="text-lg font-bold text-[#0D1B3D] dark:text-white">
              {price}
            </span>
            {priceLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {priceLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="shrink-0 w-10 h-10 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center text-[#0D1B3D] dark:text-[#0077FF]">
              {icon}
            </div>
          )}
          <div className="space-y-1.5 min-w-0">
            <h3
              className="font-semibold text-lg leading-tight"
              data-testid={`text-service-title-${slug}`}
            >
              {title}
            </h3>
            <p
              className="text-sm text-muted-foreground leading-relaxed line-clamp-2"
              data-testid={`text-service-desc-${slug}`}
            >
              {description}
            </p>
          </div>
        </div>
        {isExternal ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              size="sm"
              className="w-full mt-2 group/btn bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white border-0 rounded-full"
              data-testid={`button-learn-more-${slug}`}
            >
              {buttonLabel ?? "Register Online"}
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </a>
        ) : (
          <Link href={href ?? `/services/${slug}`}>
            <Button
              size="sm"
              className="w-full mt-2 group/btn bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white border-0 rounded-full"
              data-testid={`button-learn-more-${slug}`}
            >
              {buttonLabel ?? "Learn More & Book"}
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
