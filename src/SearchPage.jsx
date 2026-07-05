import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MAX_QUERY_LENGTH,
  MAX_WIKI_EXTRACT_LENGTH,
  OPENAI_MODEL,
  OPENAI_MODEL_LABEL,
} from "./config";
import { readApiKey } from "./storage";

// Typing animation: total duration is capped so long queries don't block the UI.
const TYPING_TICK_MS = 120;
const TYPING_MAX_TICKS = 25;

async function fetchWikipediaSummary(query, signal) {
  const encoded = encodeURIComponent(query);
  for (const lang of ["uk", "en"]) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { headers: { Accept: "application/json" }, signal }
      );
      if (res.ok) {
        const data = await res.json();
        if (typeof data.extract === "string" && data.extract.trim()) {
          return {
            extract: data.extract.slice(0, MAX_WIKI_EXTRACT_LENGTH),
            title: data.title,
            lang,
            url: data.content_urls?.desktop?.page,
          };
        }
      }
    } catch (err) {
      if (err.name === "AbortError") throw err;
      // network error — try next language
    }
  }
  return null;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (searchParams.get("q") || "").slice(0, MAX_QUERY_LENGTH);

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 gap-4">
        <p className="text-gray-500">Запит не вказаний.</p>
        <button
          onClick={() => navigate("/")}
          className="text-blue-600 underline hover:text-blue-800"
        >
          ← Повернутися на головну
        </button>
      </div>
    );
  }

  // key={q} remounts the view when the query changes, so answer/error/typed
  // state can never leak from the previous query.
  return <SearchView key={q} q={q} navigate={navigate} />;
}

function SearchView({ q, navigate }) {
  const [typed, setTyped] = useState("");
  const [answer, setAnswer] = useState(null);
  const [wikiData, setWikiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const step = Math.max(1, Math.ceil(q.length / TYPING_MAX_TICKS));
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + step, q.length);
      setTyped(q.slice(0, i));
      if (i >= q.length) clearInterval(interval);
    }, TYPING_TICK_MS);
    return () => clearInterval(interval);
  }, [q]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const wikiLink = useMemo(
    () =>
      `https://chatgpt.com/g/g-68bedab30d248191887be109dcf7aea6-wiki-analizator?q=${encodeURIComponent(q)}`,
    [q]
  );

  const askGPT = async () => {
    const apiKey = readApiKey();
    if (!apiKey) {
      setError("API ключ відсутній. Додайте свій ключ на головній сторінці.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setWikiData(null);

    try {
      const wiki = await fetchWikipediaSummary(q, controller.signal);
      setWikiData(wiki);

      const systemPrompt = wiki
        ? `Ти WikiGPT — експерт з аналізу та пояснення тем. Тобі надано уривок зі Вікіпедії про "${wiki.title}". Надай чіткий, інформативний аналіз українською мовою.`
        : "Ти WikiGPT — корисний асистент. Відповідай чітко і по суті українською мовою.";

      const userContent = wiki
        ? `Тема: ${q}\n\nВікіпедія (${wiki.lang}):\n${wiki.extract}\n\nПроаналізуй цю тему детально.`
        : q;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error?.message || `Помилка HTTP: ${res.status}`
        );
      }

      const data = await res.json();
      setAnswer(data.choices?.[0]?.message?.content || "Порожня відповідь");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Сталася помилка при зверненні до API");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="border px-4 py-2 rounded-xl shadow w-full max-w-md">
        <label htmlFor="typed-query" className="sr-only">
          Запит: {q}
        </label>
        <input
          id="typed-query"
          className="w-full outline-none"
          value={typed}
          readOnly
          aria-live="polite"
        />
      </div>

      {typed !== q && (
        <p className="mt-6 text-gray-500" aria-live="polite">
          Набираємо ваш запит...
        </p>
      )}

      {typed === q && (
        <div className="mt-6 flex flex-col gap-3 w-full max-w-md">
          <a
            href={wikiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow text-center hover:bg-blue-700"
          >
            Відкрити в Wiki-Аналізаторі
          </a>

          <button
            onClick={askGPT}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-xl shadow hover:bg-green-700 disabled:opacity-50"
          >
            {loading
              ? "Завантаження..."
              : `Отримати відповідь (Wikipedia + ${OPENAI_MODEL_LABEL})`}
          </button>

          <button
            onClick={() =>
              navigator.clipboard.writeText(window.location.href).catch(() => {})
            }
            className="bg-gray-200 px-6 py-2 rounded-xl shadow hover:bg-gray-300"
            aria-label="Скопіювати посилання у буфер обміну"
          >
            Скопіювати посилання
          </button>

          <button
            onClick={() => navigate("/")}
            className="text-gray-400 text-sm hover:text-gray-600 text-center mt-1"
          >
            ← Новий запит
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 p-4 border border-red-300 rounded-xl shadow w-full max-w-md bg-red-50 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {answer && (
        <div
          className="mt-6 p-4 border rounded-xl shadow w-full max-w-md bg-gray-50"
          aria-live="polite"
        >
          {wikiData && (
            <p className="text-xs text-gray-400 mb-3 pb-2 border-b">
              Джерело: Wikipedia{wikiData.lang === "en" ? " (EN)" : ""} —{" "}
              {wikiData.url ? (
                <a
                  href={wikiData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600"
                >
                  {wikiData.title}
                </a>
              ) : (
                wikiData.title
              )}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}
