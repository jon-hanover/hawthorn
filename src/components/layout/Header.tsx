import { NavLink } from "react-router-dom";

const linkBase = "px-3 py-2 text-sm md:text-base rounded-md transition-colors hover:bg-muted/60";
export const Header = () => {
  return <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container flex items-center justify-between h-14" aria-label="Primary">
        <div className="flex items-center gap-3">
          <NavLink to="/" aria-label="Go to homepage" className="flex items-center">
            <img src="/lovable-uploads/new_hawthorn_logo.png" alt="Hawthorn Education Strategies logo" className="h-9 md:h-10 w-auto" loading="eager" width={40} height={40} />
          </NavLink>
          
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <NavLink to="/" end className={({
          isActive
        }) => `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
            Home
          </NavLink>
          <NavLink to="/about" className={({
          isActive
        }) => `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
            About
          </NavLink>
          
        </div>
      </nav>
    </header>;
};