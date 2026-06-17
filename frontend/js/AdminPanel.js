const AdminPanel = ({ user, token, API_URL }) => {
  const [departments, setDepartments] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [allUsers, setAllUsers] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState(
    user?.system_role === "ADMIN" ? "users" : "otp",
  );
  const [auditChats, setAuditChats] = React.useState([]);

  const [userForm, setUserForm] = React.useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    department_id: "",
    role_id: "",
    system_role: "USER",
  });
  const [editingUserId, setEditingUserId] = React.useState(null);
  const [uploadFile, setUploadFile] = React.useState(null);
  const [uploadType, setUploadType] = React.useState("Документ");
  const [uploadDeptId, setUploadDeptId] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [otpForm, setOtpForm] = React.useState({ user_id: "", dept_id: "" });
  const [generatedOtp, setGeneratedOtp] = React.useState("");

  React.useEffect(() => {
    fetchData();
  }, []);
  React.useEffect(() => {
    if (activeTab === "audit" && user?.system_role === "ADMIN") {
      fetchAuditChats();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [deptsRes, rolesRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
    } catch (e) {
      console.error("Error fetching admin data", e);
    }
  };

  const fetchAuditChats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAuditChats(await res.json());
    } catch (e) {
      console.error("Error fetching audit chats", e);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const url = editingUserId
        ? `${API_URL}/admin/users/${editingUserId}`
        : `${API_URL}/users`;
      const method = editingUserId ? "PUT" : "POST";

      const payload = { ...userForm };
      if (!payload.password) delete payload.password; // Не отправляем пустой пароль
      if (payload.department_id === "") payload.department_id = null;
      else payload.department_id = parseInt(payload.department_id);
      if (payload.role_id === "") payload.role_id = null;
      else payload.role_id = parseInt(payload.role_id);

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(
          editingUserId ? "Данные обновлены!" : "Сотрудник зарегистрирован!",
        );
        fetchData();
        setUserForm({
          full_name: "",
          username: "",
          email: "",
          password: "",
          department_id: "",
          role_id: "",
          system_role: "USER",
        });
        setEditingUserId(null);
      } else {
        const err = await res.json();
        alert(err.detail || "Ошибка сохранения");
      }
    } catch (e) {
      alert("Ошибка сети");
    }
  };

  const handleEditUserClick = (u) => {
    setEditingUserId(u.id);
    setUserForm({
      full_name: u.full_name,
      username: u.username,
      email: u.email,
      password: "", // Пароль пустой, чтобы не перезаписать, если не ввели
      department_id: u.department_id || "",
      role_id: u.role_id || "",
      system_role: u.system_role,
    });
    window.scrollTo({ top: 0, behavior: "smooth" }); // Скролл наверх к форме
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setUserForm({
      full_name: "",
      username: "",
      email: "",
      password: "",
      department_id: "",
      role_id: "",
      system_role: "USER",
    });
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Точно удалить сотрудника?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
      else alert("Нельзя удалить администратора");
    } catch (e) {
      alert("Ошибка сети");
    }
  };

  const handleGenerateOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${API_URL}/tech/generate_otp?target_user_id=${otpForm.user_id}&target_dept_id=${otpForm.dept_id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setGeneratedOtp(data.otp);
      }
    } catch (e) {
      alert("Ошибка генерации");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert("Выберите файл");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    let url = `${API_URL}/kb/upload?doc_type=${encodeURIComponent(uploadType)}`;
    if (uploadDeptId) url += `&target_department_id=${uploadDeptId}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        alert("Файл загружен!");
        setUploadFile(null);
      }
    } catch (e) {
      alert("Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  if (user?.system_role !== "ADMIN" && user?.system_role !== "TECH_SPEC") {
    return <div className="p-12 text-center text-red-500">Доступ запрещен</div>;
  }

  return (
    <div className="flex h-[calc(100vh-73px)] bg-slate-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Настройки
        </h3>
        {user?.system_role === "ADMIN" && (
          <>
            <button
              onClick={() => setActiveTab("users")}
              className={`text-left px-5 py-3 rounded-2xl font-bold transition-all ${
                activeTab === "users"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className="fas fa-users w-6"></i> Пользователи
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`text-left px-5 py-3 rounded-2xl font-bold transition-all ${
                activeTab === "upload"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className="fas fa-upload w-6"></i> Загрузка в БД
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`text-left px-5 py-3 rounded-2xl font-bold transition-all ${
                activeTab === "audit"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className="fas fa-history w-6"></i> Аудит Чатов
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab("otp")}
          className={`text-left px-5 py-3 rounded-2xl font-bold transition-all ${
            activeTab === "otp"
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <i className="fas fa-key w-6"></i> Временные доступы
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          {activeTab === "users" && user?.system_role === "ADMIN" && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-8">
                Сотрудники компании
              </h2>
              <form
                onSubmit={handleCreateUser}
                className={`mb-10 p-6 rounded-2xl border transition-all ${
                  editingUserId
                    ? "bg-amber-50 border-amber-200"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h4
                    className={`font-bold ${
                      editingUserId ? "text-amber-700" : "text-slate-700"
                    }`}
                  >
                    <i
                      className={`fas ${
                        editingUserId ? "fa-user-edit" : "fa-user-plus"
                      } mr-2 ${editingUserId ? "text-amber-500" : "text-indigo-500"}`}
                    ></i>
                    {editingUserId
                      ? "Редактирование сотрудника"
                      : "Добавить нового"}
                  </h4>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      ОТМЕНА
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="ФИО"
                    value={userForm.full_name}
                    onChange={(e) =>
                      setUserForm({ ...userForm, full_name: e.target.value })
                    }
                    className="px-4 py-2 rounded-xl border outline-none focus:border-indigo-500 text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Логин"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    className="px-4 py-2 rounded-xl border outline-none focus:border-indigo-500 text-sm"
                  />
                  <input
                    type="password"
                    placeholder={
                      editingUserId
                        ? "Новый пароль (оставьте пустым)"
                        : "Пароль"
                    }
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="px-4 py-2 rounded-xl border outline-none focus:border-indigo-500 text-sm"
                    required={!editingUserId}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    className="px-4 py-2 rounded-xl border outline-none focus:border-indigo-500 text-sm"
                  />

                  <select
                    required
                    value={userForm.department_id}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        department_id: e.target.value,
                      })
                    }
                    className="px-4 py-2 rounded-xl border outline-none focus:border-indigo-500 text-sm appearance-none"
                  >
                    <option value="">Отдел...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <select
                      required
                      value={userForm.system_role}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          system_role: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl border outline-none focus:border-indigo-500 text-sm font-bold text-slate-600 appearance-none"
                    >
                      <option value="USER">USER</option>
                      <option value="TECH_SPEC">TECH_SPEC</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button
                      type="submit"
                      className={`${
                        editingUserId
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      } text-white px-6 rounded-xl font-bold shadow-md transition`}
                    >
                      <i className="fas fa-check"></i>
                    </button>
                  </div>
                </div>
              </form>
              <div className="space-y-2">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`flex justify-between p-4 border rounded-xl items-center transition ${
                      editingUserId === u.id
                        ? "border-amber-400 bg-amber-50/30"
                        : "hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                        {u.full_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">
                          {u.full_name}{" "}
                          <span className="text-slate-400 font-normal">
                            (@{u.username})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {u.department?.name || "Отдел не указан"} •
                          {u.system_role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider mr-2 ${
                          u.system_role === "ADMIN"
                            ? "bg-red-100 text-red-700"
                            : u.system_role === "TECH_SPEC"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.system_role}
                      </span>
                      <button
                        onClick={() => handleEditUserClick(u)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Редактировать"
                      >
                        <i className="fas fa-pencil-alt text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Удалить"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "upload" && user?.system_role === "ADMIN" && (
            <form
              onSubmit={handleUpload}
              className="animate-in fade-in space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Загрузка документов
              </h2>
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <input
                type="text"
                required
                placeholder="Тип (например: Приказ)"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border outline-none"
              />
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl"
              >
                {uploading ? "Загрузка..." : "Проиндексировать в БД"}
              </button>
            </form>
          )}

          {activeTab === "audit" && user?.system_role === "ADMIN" && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Аудит диалогов
              </h2>
              {auditChats.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl mb-2 border ${
                    c.is_deleted
                      ? "bg-red-50 border-red-100 opacity-60"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-700">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        ID пользователя: {c.user_id} •{" "}
                        {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                    {c.is_deleted && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded">
                        Удален пользователем
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "otp" && (
            <form
              onSubmit={handleGenerateOtp}
              className="animate-in fade-in space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Генерация OTP доступа
              </h2>
              <select
                required
                value={otpForm.user_id}
                onChange={(e) =>
                  setOtpForm({ ...otpForm, user_id: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border outline-none"
              >
                <option value="">Сотрудник...</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
              <select
                required
                value={otpForm.dept_id}
                onChange={(e) =>
                  setOtpForm({ ...otpForm, dept_id: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border outline-none"
              >
                <option value="">К какому отделу дать доступ...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl"
              >
                Сгенерировать ключ
              </button>
              {generatedOtp && (
                <div className="p-6 bg-green-50 text-green-700 text-center rounded-xl font-bold text-2xl tracking-widest">
                  {generatedOtp}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
