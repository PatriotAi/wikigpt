import React, { useState } from "react";

export default function App() {
  const [query, setQuery] = useState("");
  const [link, setLink] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  const generateLink = () => {
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query.trim());
    setLink(`${window.location.origin}/search?q=${encoded}`);
  };

  const handleQueryKeyDown = (e) => {
    if (e.key === "Enter") generateLink();
  };

  const saveKey = (e) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    localStorage.setItem("OPENAI_API_KEY", trimmed);
    setApiKey("");
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">WikiGPT</h1>

      <label htmlFor="query" className="sr-only">
        Пошуковий запит
      </label>
      <input
        id="query"
        className="border rounded-xl px-4 py-2 w-96"
        placeholder="Введіть запит..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleQueryKeyDown}
      />

      <button
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700 disabled:opacity-50"
        onClick={generateLink}
        disabled={!query.trim()}
      >
        Створити посилання
      </button>

      {link && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-gray-700">Ваше посилання:</p>
          <a href={link} className="text-blue-600 underline break-all">
            {link}
          </a>
        </div>
      )}

      <form
        onSubmit={saveKey}
        className="mt-10 flex flex-col items-center gap-2 w-96"
        aria-label="Збереження API ключа"
      >
        <label htmlFor="api-key" className="text-sm text-gray-600 self-start">
          OpenAI API ключ (зберігається лише у вашому браузері):
        </label>
        <input
          id="api-key"
          type="password"
          className="border rounded-xl px-4 py-2 w-full"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-6 py-2 rounded-xl shadow hover:bg-purple-700 disabled:opacity-50 w-full"
          disabled={!apiKey.trim()}
        >
          {keySaved ? "Ключ збережено ✓" : "Зберегти API ключ"}
        </button>
      </form>
    </div>
  );
}
