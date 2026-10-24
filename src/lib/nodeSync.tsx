import React, { useEffect, useState } from "react";
import { Server, ServerOff, RefreshCw } from "lucide-react";

const API_URL = "http://localhost:4000/api/db";

const SYNC_KEYS = [
  "peyman_pn_products",
  "peyman_pn_inventory_logs",
  "peyman_pn_customers",
  "peyman_pn_customer_tx",
  "peyman_pn_sales_invoices",
  "peyman_pn_next_invoice_no",
  "peyman_pn_purchases",
  "peyman_pn_bank_info",
  "peyman_pn_bank_tx",
  "peyman_pn_admin_credentials",
];

export const NodeBackendSync: React.FC = () => {
  const [status, setStatus] = useState<"SYNCING" | "ONLINE" | "OFFLINE">(
    "SYNCING",
  );

  useEffect(() => {
    const originalSetItem = localStorage.setItem.bind(localStorage);

    // ۱. گرفتن اطلاعات از سرور Node.js موقع باز شدن برنامه
    const loadFromNodeServer = async () => {
      try {
        setStatus("SYNCING");
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server error");

        const { data } = await res.json();
        const dbKeys = Object.keys(data || {});

        if (dbKeys.length > 0) {
          let updated = false;
          SYNC_KEYS.forEach((key) => {
            if (data[key] !== undefined) {
              const strVal =
                typeof data[key] === "string"
                  ? data[key]
                  : JSON.stringify(data[key]);

              if (localStorage.getItem(key) !== strVal) {
                originalSetItem(key, strVal);
                updated = true;
              }
            }
          });

          // اگر دیتای جدیدی از سرور Node آمد، استورها را رفرش کن
          if (updated && !sessionStorage.getItem("node_db_loaded")) {
            sessionStorage.setItem("node_db_loaded", "true");
            window.location.reload();
            return;
          }
        } else {
          // اگر فایل دیتابیس روی سرور هنوز خالی بود، اطلاعات اولیه را بفرست روی سرور
          const initialPayload: Record<string, any> = {};
          SYNC_KEYS.forEach((key) => {
            const raw = localStorage.getItem(key);
            if (raw !== null) {
              try {
                initialPayload[key] = JSON.parse(raw);
              } catch {
                initialPayload[key] = raw;
              }
            }
          });

          await fetch(`${API_URL}/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: initialPayload }),
          });
        }

        setStatus("ONLINE");
      } catch {
        setStatus("OFFLINE");
      }
    };

    loadFromNodeServer();

    // ۲. هر تغییری در هر جای برنامه داده شد، درجا بفرست به سرور Node.js
    localStorage.setItem = function (key: string, value: string) {
      originalSetItem(key, value);

      if (SYNC_KEYS.includes(key)) {
        setStatus("SYNCING");
        let parsedVal: any = value;
        try {
          parsedVal = JSON.parse(value);
        } catch {
          parsedVal = value;
        }

        fetch(`${API_URL}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: parsedVal }),
        })
          .then((r) => {
            if (r.ok) setStatus("ONLINE");
            else setStatus("OFFLINE");
          })
          .catch(() => setStatus("OFFLINE"));
      }
    };

    return () => {
      localStorage.setItem = originalSetItem;
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="print:hidden fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-lg text-[11px] font-bold"
    >
      {status === "SYNCING" && (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
          <span className="text-sky-300">در حال ذخیره در سرور Node.js...</span>
        </>
      )}
      {status === "ONLINE" && (
        <>
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-300">
            متصل به سرور دیتابیس (Port 4000)
          </span>
        </>
      )}
      {status === "OFFLINE" && (
        <>
          <ServerOff className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-300">
            سرور خاموش است (اجرا با: node server.js)
          </span>
        </>
      )}
    </div>
  );
};
