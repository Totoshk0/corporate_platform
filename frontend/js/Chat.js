const Chat = ({ token, API_URL, user }) => {
  const [sessions, setSessions] = React.useState([]);
  const [currentSessionId, setCurrentSessionId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef(null);

  const userName = user?.full_name
    ? user.full_name.split(" ")[0]
    : "Пользователь";

  React.useEffect(() => {
    fetchSessions();
  }, []);

  React.useEffect(() => {
    if (currentSessionId) fetchHistory(currentSessionId);
  }, [currentSessionId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSessions(await res.json());
    } catch (e) {
      console.error("Error fetching sessions", e);
    }
  };

  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/chat/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error("Error fetching history", e);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm("Удалить этот чат?")) return;
    try {
      const res = await fetch(`${API_URL}/chat/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (currentSessionId === id) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        fetchSessions();
      }
    } catch (e) {
      console.error("Error deleting session", e);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    const userMsg = {
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, userMsg]);
    const savedQuery = query;
    setQuery("");

    try {
      const res = await fetch(`${API_URL}/chat/ask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: savedQuery,
          session_id: currentSessionId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!currentSessionId) {
          setCurrentSessionId(data.session_id);
          fetchSessions();
        }
        await fetchHistory(data.session_id);
      }
    } catch (e) {
      console.error("Error sending message", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] flex bg-slate-50">
      {/* Sidebar: History */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            История чатов
          </h2>
          <button
            onClick={() => {
              setCurrentSessionId(null);
              setMessages([]);
            }}
            className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-3 space-y-1">
          {sessions.map((s) => (
            <div key={s.id} className="relative group">
              <button
                onClick={() => setCurrentSessionId(s.id)}
                className={`w-full text-left p-3 pr-10 rounded-xl transition ${
                  currentSessionId === s.id
                    ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-bold truncate">{s.title}</p>
                <p className="text-[10px] uppercase font-medium opacity-50 mt-1">
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(s.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                title="Удалить чат"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col max-w-5xl mx-auto w-full bg-white shadow-sm border-x border-slate-100">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-grow overflow-y-auto p-8 space-y-8 scroll-smooth"
        >
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 text-3xl shadow-inner">
                <i className="fas fa-robot"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Привет, {userName}!
                </h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                  Я помогу найти ответ в базе знаний или составить черновик
                  документа.
                </p>
              </div>
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] flex gap-4 ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-indigo-600"
                  }`}
                >
                  <i
                    className={`fas ${m.role === "user" ? "fa-user" : "fa-robot"}`}
                  ></i>
                </div>
                <div
                  className={`p-5 rounded-3xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100"
                      : "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-indigo-300">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl rounded-tl-none border border-slate-100 text-slate-400 italic text-sm">
                  ИИ анализирует документы...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-slate-100 bg-white">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              placeholder="Спросите меня о чем угодно..."
              className="w-full pl-6 pr-20 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-inner"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="absolute right-3 top-3 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100"
            >
              <i className="fas fa-paper-plane text-sm"></i>
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-4 uppercase font-bold tracking-widest">
            AI Assistant v1.0 • RAG Technology
          </p>
        </div>
      </div>
    </div>
  );
};
