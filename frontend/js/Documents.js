const Documents = ({ token, API_URL }) => {
  const [docs, setDocs] = React.useState([]);
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API_URL}/kb/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "", limit: 50 }),
      });
      const data = await res.json();
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-bold text-slate-800">Доступные документы</h3>
          <p className="text-xs text-slate-500">{docs.length} файлов найдено</p>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Загрузка...</p>
          ) : (
            docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left p-4 hover:bg-indigo-50 transition flex items-start gap-3 ${selectedDoc?.id === doc.id ? "bg-indigo-50 border-r-4 border-indigo-500" : ""}`}
              >
                <i
                  className={`mt-1 fas ${doc.title.endsWith(".xlsx") ? "fa-file-excel text-green-600" : "fa-file-lines text-indigo-500"}`}
                ></i>
                <div>
                  <p className="text-sm font-medium text-slate-800 truncate w-56">
                    {doc.title}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {doc.doc_type}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-grow bg-slate-100 p-8 flex justify-center overflow-y-auto">
        {selectedDoc ? (
          <div className="max-w-3xl w-full bg-white shadow-2xl rounded-lg p-10 min-h-[1000px] border border-slate-200">
            <div className="flex justify-between items-center mb-8 pb-4 border-b">
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedDoc.title}
              </h2>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold tracking-wider">
                {selectedDoc.doc_type.toUpperCase()}
              </span>
            </div>
            <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap font-sans leading-relaxed text-slate-700 text-base">
                {selectedDoc.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-30 text-slate-500">
            <i className="fas fa-file-invoice text-9xl mb-6"></i>
            <p className="text-xl font-medium">
              Выберите документ для просмотра
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
