import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 ml-16 transition-all duration-300 overflow-auto">
        {children}
      </main>
    </div>
  );
}
