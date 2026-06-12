import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const MAX_Q_LENGTH = 500;

async function fetchWikipediaSummary(query) {
  const encoded = encodeURIComponent(query);
  for (const lang of ["uk", "en"]) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        return {
          extract: data.extract,
          title: data.title,
          lang,
          url: data.content_urls?.desktop?.page,
        };
      }
    } catch {
      // try next language
    }
  }
  return null;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (searchParams.get("q") || "").slice(0, MAX_Q_LENGTH);

  const [typed, setTyped] = useState("");
  const [answer, setAnswer] = useState(null);
  const [wikiData, setWikiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) return;
    let i = 0;
    const interval = setInterval(() => {
      setTyped(q.slice(0, i + 1));
      i++;
      if (i >= q.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [q]);

  const wikiLink = useMemo(
    () =>
      `https://chatgpt.com/g/g-68bedab30d248191887be109dcf7aea6-wiki-analizator?q=${encodeURIComponent(q)}`,
    [q]
  );

  const askGPT = async () => {
    const apiKey = localStorage.getItem("OPENAI_API_KEY");
    if (!apiKey) {
      setError("API ключ відсутній. Додайте свій ключ на головній сторінці.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setWikiData(null);

    try {
      const wiki = await fetchWikipediaSummary(q);
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
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
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
      setError(err.message || "Сталася помилка при зверненні до API");
    } finally {
      setLoading(false);
    }
  };

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
              : "Отримати відповідь (Wikipedia + GPT-4o mini)"}
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
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
