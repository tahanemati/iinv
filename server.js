import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer"; // پکیج آپلود فایل

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

const DB_FILE = path.join(__dirname, "peyman_database.json");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ================== تنظیمات آپلود عکس (فیش و رسید) ==================
// ساخت پوشه uploads در صورت عدم وجود
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// باز کردن دسترسی عمومی به پوشه عکس‌ها تا ریکت بتونه عکس‌ها رو لود کنه
app.use("/uploads", express.static(UPLOADS_DIR));

// کانفیگ نحوه نام‌گذاری و ذخیره فایل‌ها روی هارد
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, "receipt-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// ================== API دریافت عکس از فرانت‌اند ==================
app.post("/api/upload", upload.single("receipt"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "فایلی دریافت نشد." });
  }
  // ساخت آدرس URL برای نمایش عکس در ریکت
  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

// ================== دیتابیس پیش‌فرض مدیر ==================
const DEFAULT_ADMIN = {
  id: "PN-01",
  username: "admin",
  password: "123456",
  fullName: "مدیریت گروه صنعتی پیمان",
  role: "مدیر کل و حسابداری",
};

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({ peyman_pn_admin_credentials: DEFAULT_ADMIN }, null, 2),
    "utf-8",
  );
}

const readDB = () => {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw || "{}");
    if (!parsed.peyman_pn_admin_credentials) {
      parsed.peyman_pn_admin_credentials = DEFAULT_ADMIN;
    }
    return parsed;
  } catch {
    return { peyman_pn_admin_credentials: DEFAULT_ADMIN };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
};

// ================== مسیرهای احراز هویت (Auth) ==================

// دریافت مشخصات فعلی مدیر
app.get("/api/auth/profile", (req, res) => {
  const db = readDB();
  const creds = db.peyman_pn_admin_credentials || DEFAULT_ADMIN;
  res.json({
    success: true,
    user: {
      id: creds.id || "PN-01",
      username: creds.username,
      fullName: creds.fullName,
      role: creds.role || "مدیر کل و حسابداری",
    },
  });
});

// ورود به سامانه (Login)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const creds = db.peyman_pn_admin_credentials || DEFAULT_ADMIN;

  const isDefaultMatch =
    creds.username === "admin" &&
    (creds.password === "123" || creds.password === "123456") &&
    (password === "123456" || password === "123");

  if (
    String(username || "")
      .trim()
      .toLowerCase() === creds.username.toLowerCase() &&
    (String(password || "") === creds.password || isDefaultMatch)
  ) {
    return res.json({
      success: true,
      user: {
        id: creds.id || "PN-01",
        username: creds.username,
        fullName: creds.fullName,
        role: creds.role || "مدیر کل و حسابداری",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "نام کاربری یا رمز عبور اشتباه است.",
  });
});

// بروزرسانی نام کاربری و رمز عبور از صفحه تنظیمات
app.put("/api/auth/credentials", (req, res) => {
  const { currentPassword, newUsername, newFullName, newPassword } = req.body;
  const db = readDB();
  const creds = db.peyman_pn_admin_credentials || DEFAULT_ADMIN;

  const isCurrentPassValid =
    String(currentPassword || "") === creds.password ||
    ((creds.password === "123" || creds.password === "123456") &&
      (currentPassword === "123456" || currentPassword === "123"));

  if (!isCurrentPassValid) {
    return res.status(400).json({
      success: false,
      message: "رمز عبور فعلی وارد شده اشتباه است.",
    });
  }

  if (!newUsername || !String(newUsername).trim()) {
    return res.status(400).json({
      success: false,
      message: "نام کاربری نمی‌تواند خالی باشد.",
    });
  }

  const updatedCreds = {
    id: "PN-01",
    username: String(newUsername).trim(),
    fullName: String(newFullName || "").trim() || creds.fullName,
    role: creds.role || "مدیر کل و حسابداری",
    password:
      newPassword && String(newPassword).trim() !== ""
        ? String(newPassword).trim()
        : creds.password,
  };

  db.peyman_pn_admin_credentials = updatedCreds;
  writeDB(db);

  return res.json({
    success: true,
    message: "مشخصات حساب کاربری و رمز عبور با موفقیت در سرور ذخیره شد.",
    user: {
      id: updatedCreds.id,
      username: updatedCreds.username,
      fullName: updatedCreds.fullName,
      role: updatedCreds.role,
    },
  });
});

// ================== APIهای سینک دیتابیس سایر بخش‌ها ==================
app.get("/api/db", (req, res) => {
  const data = readDB();
  res.json({ success: true, data });
});

app.post("/api/db/sync", (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res
      .status(400)
      .json({ success: false, message: "کلید نامعتبر است" });
  }
  const db = readDB();
  db[key] = value;
  writeDB(db);
  res.json({ success: true });
});

app.post("/api/db/bulk", (req, res) => {
  const { payload } = req.body;
  if (payload && typeof payload === "object") {
    const db = readDB();
    Object.assign(db, payload);
    writeDB(db);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Peyman Industrial Group (PN) Node.js Server`);
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`📁 Database file: ${DB_FILE}`);
  console.log(`==================================================`);
});
