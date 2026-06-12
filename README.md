# WikiGPT

Веб-додаток для пошуку та аналізу тем через Wikipedia + AI (OpenAI GPT-4o mini).

## Що робить

1. Вводиш тему → генеруєш шарабельне посилання
2. За посиланням — автоматично знаходить статтю у Вікіпедії (🇺🇦 uk / 🇬🇧 en) і надсилає її як контекст у GPT-4o mini
3. Отримуєш структурований AI-аналіз теми з посиланням на джерело

## Запуск

```bash
npm install
npm run dev
```

Відкрий [http://localhost:5173](http://localhost:5173)

## Збірка для продакшну

```bash
npm run build
```

## Налаштування

На головній сторінці збережи свій [OpenAI API ключ](https://platform.openai.com/api-keys) — він зберігається лише у твоєму браузері (localStorage) і нікуди не передається.

## Стек

- [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- [React Router 7](https://reactrouter.com/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/)
- [OpenAI API](https://platform.openai.com/docs/)
