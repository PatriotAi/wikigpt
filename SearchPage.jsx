import React, { useEffect, useState } from "react";

export default function SearchPage() {
  const [typed, setTyped] = useState("");
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

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

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
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
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="bg-gray-200 px-6 py-2 rounded-xl shadow"
          >
            Скопіювати посилання
          </button>
        </div>
      )}
    </div>
  );
}