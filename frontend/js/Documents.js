const Documents = ({ token, API_URL }) => {
  const [docs, setDocs] = React.useState([]);
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeQuery, setActiveQuery] = React.useState("");

  React.useEffect(() => {
    fetchDocs("");
  }, []);

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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDocs(searchQuery);
  };

  return (
    <div className="h-[calc(100vh-73px)] flex">
      {/* Sidebar */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Умный поиск по базе..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
            />
            <i className="fas fa-search absolute left-3 top-3 text-slate-400"></i>
            <button type="submit" className="hidden">
              Поиск
            </button>
          </form>
          <div className="mt-2 flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {loading ? "Поиск..." : `Найдено: ${docs.length}`}
            </span>
            {!loading && activeQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  fetchDocs("");
                }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
              >
                СБРОСИТЬ
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-slate-400">Обработка запроса ИИ...</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Ничего не найдено
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
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-medium">
                      {doc.payload?.metadata?.doc_type || "Документ"}
                    </span>
                    {activeQuery && doc.score && (
                      <span className="text-[10px] text-indigo-400 font-bold">
                        AI: {(doc.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {activeQuery && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic leading-relaxed">
                      "...{doc.content}..."
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-grow bg-slate-100 p-8 flex justify-center overflow-y-auto shadow-inner">
        {selectedDoc ? (
          <div className="max-w-3xl w-full bg-white shadow-2xl rounded-lg p-12 min-h-[1000px] border border-slate-200 relative overflow-hidden">
            {/* Watermark style background */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <i className="fas fa-shield-halved text-9xl"></i>
            </div>

            <div className="flex justify-between items-start mb-10 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 leading-tight">
                  {selectedDoc.title}
                </h2>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                  <i className="far fa-calendar"></i>{" "}
                  {selectedDoc.payload?.metadata?.date || "Дата не указана"}
                  <span className="mx-2">•</span>
                  <i className="far fa-user"></i>{" "}
                  {selectedDoc.payload?.metadata?.author_mention ||
                    "Автор не указан"}
                </p>
              </div>
              <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold tracking-widest shadow-lg shadow-indigo-100 uppercase">
                {selectedDoc.doc_type}
              </span>
            </div>

            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap font-serif leading-loose text-slate-700 text-lg">
                {selectedDoc.content}
              </div>
            </div>

            <div className="mt-20 pt-8 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-300 italic">
                Электронный документ из корпоративной системы. ID:{" "}
                {selectedDoc.id}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
              <i className="fas fa-search text-4xl text-slate-200"></i>
            </div>
            <p className="text-lg font-semibold text-slate-400">
              Начните поиск или выберите документ
            </p>
            <p className="text-sm mt-2">
              Семантический поиск найдет файл по смыслу
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
