const { useState, useEffect } = React;
const API_URL = "http://localhost:8000";

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    
    // Senior Solution: Синхронизация view с Hash в URL
    const getInitialView = () => {
        const hash = window.location.hash.replace('#', '');
        return ['home', 'documents', 'chat'].includes(hash) ? hash : 'home';
    };
    const [view, setView] = useState(getInitialView());

    useEffect(() => {
        if (token) {
            fetchUser();
        }
        
        // Слушаем изменение URL (кнопки "Назад/Вперед" или ручной ввод)
        const handleHashChange = () => setView(getInitialView());
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [token]);

    // Синхронизируем Hash при смене view
    useEffect(() => {
        window.location.hash = view;
    }, [view]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else if (res.status === 401) {
                // Разлогиниваем ТОЛЬКО если токен невалиден
                handleLogout();
            }
        } catch (e) { 
            // Если сервер упал или перезагружается, просто ждем, не выкидывая пользователя
            console.warn("Backend is warming up or unavailable. Retrying in background...");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setView('home');
        window.location.hash = 'home';
    };

    if (!token) {
        return <Login setToken={(t) => { localStorage.setItem('token', t); setToken(t); }} API_URL={API_URL} />;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar user={user} view={view} setView={setView} handleLogout={handleLogout} />
            <main className="flex-grow">
                {view === 'home' && <Home user={user} token={token} API_URL={API_URL} />}
                {view === 'documents' && <Documents token={token} API_URL={API_URL} />}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
