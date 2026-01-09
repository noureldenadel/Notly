import { useState, useEffect, useRef, memo, ComponentProps } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps extends Omit<ComponentProps<'img'>, 'src' | 'onError'> {
    src: string;
    placeholderSrc?: string;
    lowResSrc?: string;
    alt: string;
    className?: string;
    containerClassName?: string;
    fallbackSrc?: string;
    lazy?: boolean;
    blurAmount?: number;
    onLoadComplete?: () => void;
    onLoadError?: (error: Error) => void;
}

/**
 * Progressive image component with blur-up loading effect
 */
export const ProgressiveImage = memo(function ProgressiveImage({
    src,
    placeholderSrc,
    lowResSrc,
    alt,
    className,
    containerClassName,
    fallbackSrc = '/placeholder-image.svg',
    lazy = true,
    blurAmount = 20,
    onLoadComplete,
    onLoadError,
    ...imgProps
}: ProgressiveImageProps) {
    const [currentSrc, setCurrentSrc] = useState(placeholderSrc || lowResSrc || '');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(!lazy);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!lazy || !containerRef.current) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '100px',
                threshold: 0.01,
            }
        );

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [lazy]);

    // Load image progressively
    useEffect(() => {
        if (!isInView || !src) return;

        setIsLoading(true);
        setHasError(false);

        const img = new Image();

        img.onload = () => {
            setCurrentSrc(src);
            setIsLoading(false);
            onLoadComplete?.();
        };

        img.onerror = () => {
            setHasError(true);
            setIsLoading(false);
            setCurrentSrc(fallbackSrc);
            onLoadError?.(new Error(`Failed to load image: ${src}`));
        };

        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, fallbackSrc, isInView, onLoadComplete, onLoadError]);

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative overflow-hidden',
                containerClassName
            )}
        >
            {/* Skeleton placeholder when no image yet */}
            {isLoading && !currentSrc && (
                <div
                    className={cn(
                        'absolute inset-0 bg-muted animate-pulse',
                        className
                    )}
                />
            )}

            {/* Image with blur effect during loading */}
            {currentSrc && (
                <img
                    ref={imgRef}
                    src={currentSrc}
                    alt={alt}
                    className={cn(
                        'transition-all duration-300',
                        isLoading && 'scale-105',
                        className
                    )}
                    style={{
                        filter: isLoading ? `blur(${blurAmount}px)` : 'blur(0px)',
                    }}
                    {...imgProps}
                />
            )}

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <span className="text-sm text-muted-foreground">
                        Failed to load
                    </span>
                </div>
            )}
        </div>
    );
});

/**
 * Simple skeleton loader for images
 */
export function ImageSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'bg-muted animate-pulse rounded',
                className
            )}
        />
    );
}

/**
 * Image with automatic thumbnail generation
 */
export const ThumbnailImage = memo(function ThumbnailImage({
    src,
    alt,
    size = 'md',
    className,
    ...props
}: {
    src: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
} & Omit<ProgressiveImageProps, 'src' | 'alt'>) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <ProgressiveImage
            src={src}
            alt={alt}
            className={cn(
                'object-cover rounded',
                sizeClasses[size],
                className
            )}
            blurAmount={10}
            {...props}
        />
    );
});

export default ProgressiveImage;
