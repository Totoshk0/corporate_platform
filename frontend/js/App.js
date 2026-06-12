const { useState, useEffect } = React;
const API_URL = "http://localhost:8000";

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [view, setView] = useState('home');

    useEffect(() => {
        if (token) {
            fetchUser();
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                handleLogout();
            }
        } catch (e) { handleLogout(); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setView('home');
    };

    if (!token) {
        return <Login setToken={(t) => { localStorage.setItem('token', t); setToken(t); }} API_URL={API_URL} />;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar user={user} view={view} setView={setView} handleLogout={handleLogout} />
            <main className="flex-grow">
                {view === 'home' ? <Home user={user} token={token} API_URL={API_URL} /> : <Documents token={token} API_URL={API_URL} />}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
