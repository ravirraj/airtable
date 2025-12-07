// src/App.jsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { fetchMe } from "./helper/api.js";
import FormBuilder from "./components/FormBuilder.jsx";
import FormRunner from "./components/FormRunner.jsx";
import ResponsesPage from "./components/ResponsesPage.jsx";

function AppShell() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMe();
        if (data.ok) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.log("me error", e);
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  function goLogin() {
    window.location.href = "http://localhost:3000/auth/airtable";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: 4 }}>
              Airtable Form Builder
            </h1>
            <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Minimal UI • Logic-focused
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {checking ? (
              <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                Checking session…
              </div>
            ) : user ? (
              <>
                <div style={{ fontSize: "0.85rem" }}>
                  Logged in as <strong>{user.airtableUserId}</strong>
                </div>
                <button
                  style={{
                    marginTop: 4,
                    fontSize: "0.8rem",
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/builder")}
                >
                  Open builder
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: "0.8rem", color: "#f87171" }}>
                  Not logged in
                </div>
                <button
                  style={{
                    marginTop: 4,
                    fontSize: "0.8rem",
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                    cursor: "pointer",
                  }}
                  onClick={goLogin}
                >
                  Connect Airtable
                </button>
              </>
            )}
          </div>
        </header>

        {error && (
          <div
            style={{
              border: "1px solid #b91c1c",
              background: "#450a0a",
              padding: 8,
              borderRadius: 8,
              fontSize: "0.85rem",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <Home
                user={user}
                goLogin={goLogin}
                onOpenBuilder={() => navigate("/builder")}
              />
            }
          />
          <Route
            path="/builder"
            element={
              <FormBuilder
                onFormCreated={(id) => navigate(`/form/${id}`)}
              />
            }
          />
          <Route path="/form/:formId" element={<FormRunner />} />
          <Route
            path="/forms/:formId/responses"
            element={<ResponsesPage />}
          />
        </Routes>
      </div>
    </div>
  );
}

function Home({ user, goLogin, onOpenBuilder }) {
  const [formId, setFormId] = useState("");
  const [respFormId, setRespFormId] = useState("");
  const navigate = useNavigate();

  function openForm() {
    if (!formId) return;
    navigate(`/form/${formId}`);
  }

  function openResponses() {
    if (!respFormId) return;
    navigate(`/forms/${respFormId}/responses`);
  }

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        background: "rgba(15,23,42,0.9)",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Welcome</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        Use the builder to create a form from your Airtable base, then share
        the <code style={{ fontSize: "0.8rem" }}>/form/:id</code> URL to
        collect responses.
      </p>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {user ? (
          <button
            onClick={onOpenBuilder}
            style={{
              fontSize: "0.9rem",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#0f172a",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            Open Form Builder
          </button>
        ) : (
          <button
            onClick={goLogin}
            style={{
              fontSize: "0.9rem",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#0f172a",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            Connect Airtable to start
          </button>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>
          Open existing form by ID
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.85rem",
            }}
            placeholder="Form ID"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
          />
          <button
            onClick={openForm}
            style={{
              fontSize: "0.85rem",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#0f172a",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            Open
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>
          View responses by form ID
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.85rem",
            }}
            placeholder="Form ID"
            value={respFormId}
            onChange={(e) => setRespFormId(e.target.value)}
          />
          <button
            onClick={openResponses}
            style={{
              fontSize: "0.85rem",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#0f172a",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
