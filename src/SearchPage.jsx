import React, { useEffect, useState } from "react";

export default function SearchPage() {
  const [typed, setTyped] = useState("");
  const [answer, setAnswer] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

  // Анімація набору тексту
  useEffect(() => {
    if (q) {
      let i = 0;
      const interval = setInterval(() => {
        setTyped(q.slice(0, i + 1));
        i++;
        if (i >= q.length) clearInterval(interval);
      }, 120);
    }
  }, [q]);

  const wikiLink = `https://chatgpt.com/g/g-68bedab30d248191887be109dcf7aea6-wiki-analizator?q=${encodeURIComponent(
    q || ""
  )}`;

  // Виклик API через власний ключ
  const askGPT = async () => {
    const apiKey =
      localStorage.getItem("OPENAI_API_KEY") || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      alert("У вас немає API ключа! Додайте свій у налаштуваннях.");
      return;
    }

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

    const data = await res.json();
    setAnswer(data.choices?.[0]?.message?.content || "Помилка");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white p-6">
      <div className="border px-4 py-2 rounded-xl shadow w-96">
        <input className="w-full outline-none" value={typed} readOnly />
      </div>
      <p className="mt-6 text-gray-500">Набираємо ваш запит...</p>

      {typed === q && q && (
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={wikiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow text-center"
          >
            Відкрити в Wiki-Аналізаторі
          </a>

          <button
            onClick={askGPT}
            className="bg-green-600 text-white px-6 py-2 rounded-xl shadow"
          >
            Отримати відповідь тут
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="bg-gray-200 px-6 py-2 rounded-xl shadow"
          >
            Скопіювати посилання
          </button>
        </div>
      )}

      {answer && (
        <div className="mt-6 p-4 border rounded-xl shadow w-96 bg-gray-50 text-sm whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
