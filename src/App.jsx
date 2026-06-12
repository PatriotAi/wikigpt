import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [query, setQuery] = useState("");
  const [link, setLink] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [hasKey, setHasKey] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setHasKey(!!localStorage.getItem("OPENAI_API_KEY"));
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
    try {
      localStorage.setItem("OPENAI_API_KEY", trimmed);
      setApiKey("");
      setHasKey(true);
      setSaveError(null);
      setKeySaved(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setKeySaved(false), 3000);
    } catch {
      setSaveError("Неможливо зберегти ключ: браузер заблокував localStorage (приватний режим?).");
    }
  };

  const removeKey = () => {
    localStorage.removeItem("OPENAI_API_KEY");
    setHasKey(false);
    setKeySaved(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-2">WikiGPT</h1>
      <p className="text-gray-500 text-sm mb-8">
        Пошук та аналіз тем через Wikipedia + AI
      </p>

      <div className="w-full max-w-md">
        <label htmlFor="query" className="sr-only">
          Пошуковий запит
        </label>
        <input
          id="query"
          className="border rounded-xl px-4 py-2 w-full"
          placeholder="Введіть тему для аналізу..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleQueryKeyDown}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {query.length}/500
        </p>
      </div>

      <button
        className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 w-full max-w-md"
        onClick={generateLink}
        disabled={!query.trim()}
      >
        Створити посилання
      </button>

      {link && (
        <div className="mt-6 w-full max-w-md">
          <p className="mb-1 text-gray-700 text-sm">Ваше посилання:</p>
          <a
            href={link}
            className="text-blue-600 underline break-all text-sm"
          >
            {link}
          </a>
        </div>
      )}

      <div className="mt-10 w-full max-w-md border-t pt-6">
        {hasKey ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <span className="text-sm text-green-700">
              OpenAI API ключ збережено ✓
            </span>
            <button
              onClick={removeKey}
              className="text-xs text-red-500 hover:text-red-700 ml-4"
              aria-label="Видалити збережений API ключ"
            >
              Видалити
            </button>
          </div>
        ) : (
          <form
            onSubmit={saveKey}
            className="flex flex-col gap-2"
            aria-label="Збереження API ключа"
          >
            <label htmlFor="api-key" className="text-sm text-gray-600">
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
            {saveError && (
              <p role="alert" className="text-xs text-red-600">
                {saveError}
              </p>
            )}
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded-xl shadow hover:bg-purple-700 disabled:opacity-50 w-full"
              disabled={!apiKey.trim()}
            >
              {keySaved ? "Ключ збережено ✓" : "Зберегти API ключ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
