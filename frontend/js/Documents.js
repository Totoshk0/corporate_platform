const Documents = ({ token, API_URL }) => {
  const [docs, setDocs] = React.useState([]);
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeQuery, setActiveQuery] = React.useState("");

  // Состояния для модального окна
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState({
    templates: [],
    users: [],
    departments: [],
  });
  const [form, setForm] = React.useState({
    template_id: "",
    signatories: [],
    distributions: [],
  });
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    fetchDocs("");
  }, []);

  React.useEffect(() => {
    if (isModalOpen) fetchModalData();
  }, [isModalOpen]);

  const fetchDocs = async (query) => {
    setLoading(true);
    setActiveQuery(query);
    try {
      const res = await fetch(`${API_URL}/kb/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query, limit: 20 }),
      });
      const data = await res.json();
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchModalData = async () => {
    try {
      const [t, u, d] = await Promise.all([
        fetch(`${API_URL}/kb/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setModalData({
        templates: await t.json(),
        users: await u.json(),
        departments: await d.json(),
      });
    } catch (e) {
      console.error("Error loading modal data", e);
    }
  };

  const handleCreate = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/kb/documents/draft`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: parseInt(form.template_id),
          signatory_user_ids: form.signatories,
          distribution_department_ids: form.distributions,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ template_id: "", signatories: [], distributions: [] });
        await fetchDocs(""); // Ждем обновления списка
      } else {
        const errorData = await res.json();
        console.error("Server Error:", errorData);
        alert(
          "Ошибка при создании: " + (errorData.detail || "Неизвестная ошибка"),
        );
      }
    } catch (e) {
      console.error("Network Error:", e);
      alert("Ошибка сети. Проверьте соединение с сервером.");
    } finally {
      setCreating(false);
    }
  };

  const toggleSignatory = (id) => {
    setForm((prev) => ({
      ...prev,
      signatories: prev.signatories.includes(id)
        ? prev.signatories.filter((i) => i !== id)
        : [...prev.signatories, id],
    }));
  };

  const toggleDept = (id) => {
    setForm((prev) => ({
      ...prev,
      distributions: prev.distributions.includes(id)
        ? prev.distributions.filter((i) => i !== id)
        : [...prev.distributions, id],
    }));
  };

  return (
    <div className="h-[calc(100vh-73px)] flex relative">
      {/* Sidebar */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Документы
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 group"
              title="Создать по шаблону"
            >
              <i className="fas fa-plus text-xs group-hover:rotate-90 transition-transform"></i>
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchDocs(searchQuery);
            }}
            className="relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Умный поиск по базе..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
            />
            <i className="fas fa-search absolute left-3.5 top-3.5 text-slate-400"></i>
          </form>
          <div className="mt-2 flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {loading ? "Поиск..." : `Найдено: ${docs.length}`}
            </span>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-slate-400 font-medium">
                Работает ИИ...
              </p>
            </div>
          ) : (
            docs.map((doc) => (
              <button
                key={doc.id + (doc.score || 0)}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left p-4 hover:bg-indigo-50/50 transition flex items-start gap-3 group ${selectedDoc?.id === doc.id ? "bg-indigo-50 border-r-4 border-indigo-500" : ""}`}
              >
                <div
                  className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.title.endsWith(".xlsx") ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-500"}`}
                >
                  <i
                    className={`fas ${doc.title.endsWith(".xlsx") ? "fa-file-excel" : "fa-file-lines"}`}
                  ></i>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-bold tracking-tighter">
                      {doc.payload?.metadata?.doc_type || "Документ"}
                    </span>
                    {activeQuery && doc.score && (
                      <span className="text-[10px] text-indigo-500 font-extrabold uppercase">
                        {(doc.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-grow bg-slate-100 p-8 flex justify-center overflow-y-auto shadow-inner">
        {selectedDoc ? (
          <div className="max-w-3xl w-full bg-white shadow-2xl rounded-2xl p-12 min-h-screen border border-slate-200 relative overflow-hidden">
            <div className="flex justify-between items-start mb-10 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 leading-tight">
                  {selectedDoc.title}
                </h2>
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-2 font-medium">
                  <i className="far fa-calendar"></i>{" "}
                  {selectedDoc.payload?.metadata?.date || "08.06.2026"}
                  <span className="opacity-30">|</span>
                  <i className="far fa-user"></i>{" "}
                  {selectedDoc.payload?.metadata?.author_mention ||
                    "Автор не указан"}
                </p>
              </div>
              <span className="px-4 py-1.5 bg-slate-800 text-white rounded-full text-[10px] font-bold tracking-widest uppercase">
                {selectedDoc.doc_type}
              </span>
            </div>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap font-serif text-slate-700 text-lg leading-relaxed">
              {selectedDoc.content}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6 border border-slate-200">
              <i className="fas fa-search text-3xl text-slate-200"></i>
            </div>
            <p className="text-lg font-bold text-slate-400">
              Выберите документ для просмотра
            </p>
          </div>
        )}
      </div>

      {/* Modal Stage 2: Full Functional UI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <i className="fas fa-file-signature"></i> Создать документ
                </h3>
                <p className="text-indigo-100 text-[11px] font-medium uppercase tracking-wider mt-1">
                  Новый черновик по шаблону
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 transition flex items-center justify-center"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <form
              onSubmit={handleCreate}
              className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
              {/* Шаблон */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest ml-1">
                  1. Выбор шаблона
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {modalData.templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, template_id: t.id })}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${form.template_id === t.id ? "border-indigo-600 bg-indigo-50/50 shadow-md" : "border-slate-100 hover:border-slate-200 bg-slate-50/50"}`}
                    >
                      <p
                        className={`font-bold text-sm ${form.template_id === t.id ? "text-indigo-700" : "text-slate-700"}`}
                      >
                        {t.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">
                        {t.doc_type}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Подписанты */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest ml-1">
                  2. Кто должен подписать?
                </label>
                <div className="space-y-2">
                  {modalData.users
                    .filter((u) => u.username !== "GavrilovAA")
                    .map((u) => (
                      <label
                        key={u.id}
                        className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${form.signatories.includes(u.id) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"}`}
                      >
                        <input
                          type="checkbox"
                          checked={form.signatories.includes(u.id)}
                          onChange={() => toggleSignatory(u.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {u.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">
                            {u.department?.name || "Отдел не указан"}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              {/* Рассылка по отделам */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest ml-1">
                  3. Кому в рассылку? (Отделы)
                </label>
                <div className="flex flex-wrap gap-2">
                  {modalData.departments.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDept(d.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${form.distributions.includes(d.id) ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600"}`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.template_id}
                className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition flex items-center justify-center gap-2"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <i className="fas fa-check text-xs"></i>
                )}
                {creating ? "Создание..." : "Создать документ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
