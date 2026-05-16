const Navbar = ({ user, view, setView, handleLogout }) => {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <i className="fas fa-brain"></i> Hub
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => setView("home")}
            className={`px-3 py-2 rounded-md transition ${view === "home" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {" "}
            Главная{" "}
          </button>
          <button
            onClick={() => setView("documents")}
            className={`px-3 py-2 rounded-md transition ${view === "documents" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {" "}
            Документы{" "}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold">{user?.full_name}</p>
          <p className="text-xs text-slate-500">{user?.department?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>
  );
};
