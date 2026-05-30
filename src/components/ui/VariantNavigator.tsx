import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getNextVariantUrl, getPrevVariantUrl, getVariantByUrl, variantConfig } from '@/config/variants';

export function VariantNavigator() {
  const { variantId } = useParams<{ variantId: string }>();
  const navigate = useNavigate();
  const currentUrl = Number(variantId) || variantConfig.defaultVariant;

  const enabledCount = variantConfig.variants.filter(v => v.enabled).length;
  if (enabledCount <= 1) return null;

  const prevUrl = getPrevVariantUrl(currentUrl);
  const nextUrl = getNextVariantUrl(currentUrl);
  const prevVariant = getVariantByUrl(prevUrl);
  const nextVariant = getVariantByUrl(nextUrl);

  const buttonClass =
    'bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 transition-colors hover:bg-white/20';
  const iconClass = 'w-6 h-6 text-white/80 group-hover:text-white';

  return (
    <>
      <motion.button
        onClick={() => navigate(`/${prevUrl}`)}
        className={`fixed left-6 top-1/2 -translate-y-1/2 z-50 group ${buttonClass}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`View ${prevVariant?.name ?? 'previous'} design`}
        title={`View ${prevVariant?.name ?? 'previous'} design`}
      >
        <ChevronLeft className={iconClass} />
      </motion.button>

      <motion.button
        onClick={() => navigate(`/${nextUrl}`)}
        className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 group ${buttonClass}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`View ${nextVariant?.name ?? 'next'} design`}
        title={`View ${nextVariant?.name ?? 'next'} design`}
      >
        <ChevronRight className={iconClass} />
      </motion.button>
    </>
  );
}
