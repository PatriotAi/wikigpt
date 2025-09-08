import React, { useState } from "react";

export default function App() {
  const [query, setQuery] = useState("");
  const [link, setLink] = useState("");

  const generateLink = () => {
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query);
    const url = `${window.location.origin}/search?q=${encoded}`;
    setLink(url);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">wikigpt</h1>
      <input
        className="border rounded-xl px-4 py-2 w-96"
        placeholder="Введіть запит..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl shadow"
        onClick={generateLink}
      >
        Створити посилання
      </button>

      {link && (
        <div className="mt-6">
          <p className="mb-2">Ваше посилання:</p>
          <a href={link} className="text-blue-600 underline">
            {link}
          </a>
        </div>
      )}
    </div>
  );
}
