import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

export function SplineScene({ scene, className }) {
  return (
    <div className="spline-transparent h-full w-full">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300" />
          </div>
        }
      >
        <Spline scene={scene} className={className} />
      </Suspense>
    </div>
  );
}

