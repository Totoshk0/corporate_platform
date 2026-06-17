const Navbar = ({ user, view, setView, handleLogout }) => {
  const userName = user?.full_name || "Загрузка...";
  const deptName = user?.department?.name || "";
  const isAdmin = user?.system_role === "ADMIN" || user?.system_role === "TECH_SPEC";

  return (
    <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <div
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => setView("home")}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
            <i className="fas fa-hub text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">
              CORP<span className="text-indigo-600">HUB</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Knowledge Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("home")}
            className={`px-3 py-2 rounded-md transition ${
              view === "home" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Главная
          </button>
          <button
            onClick={() => setView("documents")}
            className={`px-3 py-2 rounded-md transition ${
              view === "documents" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Документы
          </button>
          <button
            onClick={() => setView("chat")}
            className={`px-3 py-2 rounded-md transition ${
              view === "chat" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            AI Ассистент
          </button>

          {isAdmin && (
            <button
              onClick={() => setView("admin")}
              className={`px-3 py-2 rounded-md font-bold transition flex items-center gap-2 ${
                view === "admin" ? "bg-red-50 text-red-700" : "text-red-500 hover:bg-red-50"
              }`}
            >
              <i className="fas fa-shield-alt"></i> Панель управления
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-xs text-slate-500">{deptName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>
  );
};
