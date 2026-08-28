import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

function Layout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-white relative overflow-x-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#0a1220_0%,_#050a14_45%,_#03060d_100%)]" />
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[400px] h-[400px] bg-sky-300/5 rounded-full blur-[100px]" />

      <div className="relative z-10 flex w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default Layout;