const Home = ({ user }) => (
    <div className="p-12 max-w-4xl mx-auto">
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
    </div>
);
