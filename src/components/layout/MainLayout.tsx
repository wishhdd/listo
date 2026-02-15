import { Outlet } from "react-router-dom";
import { InstallPrompt } from "../pwa/InstallPrompt";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-safe overflow-hidden touch-pan-y">
      <div className="h-1 w-full bg-slate-50 sticky top-0 z-50" />
      <Outlet />
      <InstallPrompt />
    </div>
  );
}
