import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { RetroGrid } from "@/components/ui/retro-grid";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <RetroGrid className="opacity-30" />
      <div className="relative z-10 text-center">
        <h1 className="mb-4 text-4xl font-retro gradient-text-retro">404</h1>
        <p className="mb-4 text-xl font-retro text-foreground">Oops! Page not found</p>
        <Link to="/" className="font-retro text-primary underline hover:text-secondary transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
