import { lazy, Suspense, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getVariantByUrl, variantConfig } from '@/config/variants';
// Variant navigator arrows are hidden for now. Other variants stay reachable by
// direct URL (e.g. /2). To bring the arrows back, uncomment this import and the
// <VariantNavigator /> usage below.
// import { VariantNavigator } from '@/components/ui/VariantNavigator';

const variantModules: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  v1: lazy(() => import('@/variants/v1/HomeView')),
  v2: lazy(() => import('@/variants/v2/HomeView')),
};

export function VariantLoader() {
  const { variantId } = useParams<{ variantId: string }>();
  const urlNumber = Number(variantId);
  const variant = getVariantByUrl(urlNumber);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [variantId]);

  if (!variant || !variant.enabled) {
    return <Navigate to={`/${variantConfig.defaultVariant}`} replace />;
  }

  const LazyHomeView = variantModules[variant.folder];
  if (!LazyHomeView) {
    return <Navigate to={`/${variantConfig.defaultVariant}`} replace />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      {/* <VariantNavigator /> */}
      <LazyHomeView />
    </Suspense>
  );
}
