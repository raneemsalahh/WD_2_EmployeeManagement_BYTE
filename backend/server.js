require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Employee Management API is running!" });
});

// ---------- LOGIN (Admin only) ----------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // مقارنة مباشرة لأن الأدمن واحد بس ومحفوظ في .env
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ username, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });

  res.json({ message: "Login successful", token });
});

// ---------- Middleware: يتأكد من التوكن ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

// ---------- GET all employees (public) ----------
app.get("/employees", (req, res) => {
  const employees = db.prepare("SELECT * FROM employees").all();
  res.json(employees);
});

// ---------- GET one employee by id (public) ----------
app.get("/employees/:id", (req, res) => {
  const { id } = req.params;
  const employee = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  res.json(employee);
});

// ---------- CREATE employee (protected) ----------
app.post("/employees", authenticateToken, (req, res) => {
  const { name, email, position, department, salary } = req.body;

  // Validation
  if (!name || !email || !position || !department || salary === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (typeof salary !== "number" || salary < 0) {
    return res.status(400).json({ error: "Salary must be a positive number" });
  }

  try {
    const insert = db.prepare(
      "INSERT INTO employees (name, email, position, department, salary) VALUES (?, ?, ?, ?, ?)"
    );
    const result = insert.run(name, email, position, department, salary);

    const newEmployee = db
      .prepare("SELECT * FROM employees WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(newEmployee);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ---------- UPDATE employee (protected) ----------
app.put("/employees/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email, position, department, salary } = req.body;

  const existing = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Employee not found" });
  }

  if (!name || !email || !position || !department || salary === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (typeof salary !== "number" || salary < 0) {
    return res.status(400).json({ error: "Salary must be a positive number" });
  }

  try {
    db.prepare(
      "UPDATE employees SET name = ?, email = ?, position = ?, department = ?, salary = ? WHERE id = ?"
    ).run(name, email, position, department, salary, id);

    const updated = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ---------- DELETE employee (protected) ----------
app.delete("/employees/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Employee not found" });
  }

  db.prepare("DELETE FROM employees WHERE id = ?").run(id);

  res.json({ message: "Employee deleted successfully", employee: existing });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});