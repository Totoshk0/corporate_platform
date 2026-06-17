const { useState, useEffect, useCallback } = React;
const API_URL = "http://178.20.46.128:8000";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  const getInitialState = () => {
    const hash = window.location.hash.replace("#", "");
    const parts = hash.split("/");
    const view = parts[0];
    const id = parts[1] || null;
    const validViews = ["home", "documents", "chat", "admin"];
    
    return {
      view: validViews.includes(view) ? view : "home",
      id: id,
    };
  };

  const [route, setRoute] = useState(getInitialState());

  const fetchUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.warn("Backend warming up...");
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
    const handleHashChange = () => setRoute(getInitialState());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [fetchUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.hash = "home";
  };

  if (!token) {
    return (
      <Login
        setToken={(t) => {
          localStorage.setItem("token", t);
          setToken(t);
        }}
        API_URL={API_URL}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user}
        view={route.view}
        setView={(v) => (window.location.hash = v)}
        handleLogout={handleLogout}
      />
      <main className="flex-grow">
        {route.view === "home" && (
          <Home user={user} token={token} API_URL={API_URL} />
        )}
        {route.view === "documents" && (
          <Documents
            token={token}
            API_URL={API_URL}
            user={user}
            initialId={route.id}
          />
        )}
        {route.view === "chat" && (
          <Chat token={token} API_URL={API_URL} user={user} />
        )}
        {route.view === "admin" && (
          <AdminPanel token={token} API_URL={API_URL} user={user} />
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
