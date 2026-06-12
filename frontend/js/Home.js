const Home = ({ user, token, API_URL }) => {
    const [departments, setDepartments] = React.useState([]);
    const [roles, setRoles] = React.useState([]);
    const [formData, setFormData] = React.useState({
        full_name: '', username: '', email: '', password: '',
        department_id: '', role_id: '', system_role: 'USER'
    });
    const [msg, setMsg] = React.useState({ text: '', isError: false });

    React.useEffect(() => {
        if (user?.system_role === 'ADMIN') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [deptsRes, rolesRes] = await Promise.all([
                fetch(`${API_URL}/departments`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/roles`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (deptsRes.ok) setDepartments(await deptsRes.json());
            if (rolesRes.ok) setRoles(await rolesRes.json());
        } catch (e) { console.error("Error fetching admin data", e); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMsg({ text: 'Сохранение...', isError: false });
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setMsg({ text: 'Сотрудник успешно зарегистрирован!', isError: false });
                setFormData({ full_name: '', username: '', email: '', password: '', department_id: '', role_id: '', system_role: 'USER' });
            } else {
                const err = await res.json();
                setMsg({ text: err.detail || 'Ошибка регистрации', isError: true });
            }
        } catch (e) { setMsg({ text: 'Сервер недоступен', isError: true }); }
    };

    return (
        <div className="p-12 max-w-4xl mx-auto space-y-10">
            {/* Приветствие */}
            <section>
                <h1 className="text-4xl font-bold mb-4 text-slate-800">Добро пожаловать, {user?.full_name}! 👋</h1>
                <p className="text-lg text-slate-600 mb-8">Вы находитесь в корпоративной базе знаний. Используйте вкладку «Документы» для доступа к материалам вашего отдела.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <i className="fas fa-building text-indigo-500 text-2xl mb-4"></i>
                        <h3 className="font-bold text-lg mb-2">Ваш отдел</h3>
                        <p className="text-slate-600">{user?.department?.name || 'Не указан'}</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <i className="fas fa-user-tag text-indigo-500 text-2xl mb-4"></i>
                        <h3 className="font-bold text-lg mb-2">Роль</h3>
                        <p className="text-slate-600">{user?.company_role?.title || 'Сотрудник'}</p>
                    </div>
                </div>
            </section>

            {/* Панель Администратора */}
            {user?.system_role === 'ADMIN' && (
                <section className="pt-10 border-t border-slate-200">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <i className="fas fa-user-plus text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Управление персоналом</h2>
                            <p className="text-slate-500 text-sm">Регистрация новых сотрудников в системе</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateUser} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">ФИО сотрудника</label>
                                <input type="text" required placeholder="Иванов Иван Иванович" 
                                    value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Логин (Системный)</label>
                                <input type="text" required placeholder="IvanovII" 
                                    value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email</label>
                                <input type="email" required placeholder="ivanov@company.com" 
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Пароль</label>
                                <input type="password" required placeholder="••••••••" 
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Отдел</label>
                                    <select required value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none">
                                        <option value="">Выбрать...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Должность</label>
                                    <select required value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none">
                                        <option value="">Выбрать...</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Системная роль</label>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setFormData({...formData, system_role: 'USER'})}
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${formData.system_role === 'USER' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}>Сотрудник</button>
                                    <button type="button" onClick={() => setFormData({...formData, system_role: 'ADMIN'})}
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${formData.system_role === 'ADMIN' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-100 text-slate-400'}`}>Админ</button>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-4 border-t border-slate-50 flex items-center justify-between">
                            {msg.text && (
                                <p className={`text-sm font-semibold ${msg.isError ? 'text-red-500' : 'text-green-500'}`}>
                                    <i className={`fas ${msg.isError ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2`}></i>
                                    {msg.text}
                                </p>
                            )}
                            <button type="submit" className="ml-auto px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">
                                Зарегистрировать
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </div>
    );
};
