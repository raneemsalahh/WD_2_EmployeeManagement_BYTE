import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5001";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function App() {
  const [employees, setEmployees] = useState([]);
  const [token, setToken] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    department: "",
    salary: "",
  });
  const [formError, setFormError] = useState("");

  const isAdmin = !!token;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch(`${API_URL}/employees`);
    const data = await res.json();
    setEmployees(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error);
        return;
      }
      setToken(data.token);
      setLoginData({ username: "", password: "" });
      setShowLogin(false);
    } catch (err) {
      setLoginError("Server not reachable");
    }
  };

  const handleLogout = () => setToken("");

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", position: "", department: "", salary: "" });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (employee) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
    });
    setFormError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const payload = { ...formData, salary: Number(formData.salary) };
    const url = editingId ? `${API_URL}/employees/${editingId}` : `${API_URL}/employees`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error);
        return;
      }

      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      setFormError("Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this employee from the roster?")) return;
    await fetch(`${API_URL}/employees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchEmployees();
  };

  return (
    <div className="page">
      <div className="container">
        <header>
          <div>
            <h1>Employee Directory</h1>
            <p className="subtitle">
              {employees.length} {employees.length === 1 ? "person" : "people"} on record
            </p>
          </div>

          <div className="header-actions">
            {isAdmin ? (
              <>
                <button className="btn primary" onClick={openAddForm}>
                  Add employee
                </button>
                <button className="btn ghost" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <button className="btn ghost" onClick={() => setShowLogin(!showLogin)}>
                Admin sign in
              </button>
            )}
          </div>
        </header>

        {!isAdmin && showLogin && (
          <form className="login-panel" onSubmit={handleLogin}>
            <label>
              Username
              <input
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
            </label>
            <button className="btn primary" type="submit">
              Sign in
            </button>
            {loginError && <p className="error">{loginError}</p>}
          </form>
        )}

        <div className="table-wrapper">
          {employees.length === 0 ? (
            <p className="empty-state">No one on the roster yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Salary</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">{getInitials(emp.name)}</span>
                        <div>
                          <div className="person-name">{emp.name}</div>
                          <div className="person-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.position}</td>
                    <td>
                      <span className="tag">{emp.department}</span>
                    </td>
                    <td className="salary">{Number(emp.salary).toLocaleString()} EGP</td>
                    {isAdmin && (
                      <td className="actions">
                        <button className="btn small" onClick={() => openEditForm(emp)}>
                          Edit
                        </button>
                        <button className="btn small danger" onClick={() => handleDelete(emp.id)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? "Edit employee" : "Add employee"}</h3>
              <form onSubmit={handleFormSubmit}>
                <label>
                  Name
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </label>
                <label>
                  Position
                  <input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </label>
                <label>
                  Department
                  <input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </label>
                <label>
                  Salary
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </label>

                <div className="modal-actions">
                  <button className="btn primary" type="submit">
                    {editingId ? "Save changes" : "Add employee"}
                  </button>
                  <button className="btn ghost" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
                {formError && <p className="error">{formError}</p>}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;