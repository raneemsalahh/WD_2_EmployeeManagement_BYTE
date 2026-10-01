const Database = require("better-sqlite3");

// 1. نفتح (أو نعمل لو مش موجود) ملف قاعدة البيانات
const db = new Database("employees.db");

// 2. نعمل الجدول لو مش موجود
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL
  )
`);

// 3. Seed data: نحط بيانات ابتدائية بس لو الجدول فاضي
const { count } = db.prepare("SELECT COUNT(*) AS count FROM employees").get();

if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO employees (name, email, position, department, salary) VALUES (?, ?, ?, ?, ?)"
  );

  insert.run("Sara Ahmed", "sara@company.com", "Software Engineer", "IT", 15000);
  insert.run("Omar Ali", "omar@company.com", "UI Designer", "Design", 12000);
  insert.run("Mona Hassan", "mona@company.com", "HR Specialist", "HR", 10000);

  console.log("Seed data inserted");
}

console.log(`Database ready. Employees in table: ${db.prepare("SELECT COUNT(*) AS count FROM employees").get().count}`);

module.exports = db;