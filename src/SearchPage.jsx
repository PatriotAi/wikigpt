import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [typed, setTyped] = useState("");
  const [answer, setAnswer] = useState(null);
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

  const wikiLink = `https://chatgpt.com/g/g-68bedab30d248191887be109dcf7aea6-wiki-analizator?q=${encodeURIComponent(q)}`;

  const askGPT = async () => {
    const apiKey = localStorage.getItem("OPENAI_API_KEY");
    if (!apiKey) {
      setError("API ключ відсутній. Додайте свій ключ на головній сторінці.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: q }],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Помилка HTTP: ${res.status}`);
      }

      const data = await res.json();
      setAnswer(data.choices?.[0]?.message?.content || "Порожня відповідь");
    } catch (err) {
      setError(err.message || "Сталася помилка при зверненні до API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="border px-4 py-2 rounded-xl shadow w-96">
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

      {typed === q && q && (
        <div className="mt-6 flex flex-col gap-3 w-96">
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
            {loading ? "Завантаження..." : "Отримати відповідь тут"}
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="bg-gray-200 px-6 py-2 rounded-xl shadow hover:bg-gray-300"
          >
            Скопіювати посилання
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 p-4 border border-red-300 rounded-xl shadow w-96 bg-red-50 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {answer && (
        <div
          className="mt-6 p-4 border rounded-xl shadow w-96 bg-gray-50 text-sm whitespace-pre-wrap"
          aria-live="polite"
        >
          {answer}
        </div>
      )}
    </div>
  );
}
