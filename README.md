# Listo

**Listo** — это современное PWA-приложение для ведения списков покупок. Разработано с фокусом на скорость, работу в оффлайне и удобство использования на мобильных устройствах.

**Демо:** https://wishhdd.ru/listo/

## Особенности

- **Progressive Web App (PWA):** Устанавливается на экран телефона как нативное приложение. Работает без интернета.
- **Умная сортировка:**
  - Активные товары всегда сверху.
  - При поиске (ввод > 2 символов) совпадения "всплывают" на самый верх списка.
- **Жесты (Mobile First):** Поддержка свайпа влево для удаления элементов.
- **Local First:** Все данные хранятся локально в браузере (localStorage). Ваши списки не пропадут при закрытии вкладки.
- **UI/UX:** Минималистичный интерфейс, оптимизированный под управление одной рукой.

## Технический стек

- **Core:** [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Сборка:** [Vite](https://vitejs.dev/)
- **Стилизация:** [Tailwind CSS](https://tailwindcss.com/)
- **Иконки:** [Lucide React](https://lucide.dev/)
- **Состояние:** [Zustand](https://zustand-demo.pmnd.rs/) (authStore, listStore, uiStore)
- **Маршрутизация:** [React Router](https://reactrouter.com/) v7
- **DnD:** [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) (перетаскивание списков/элементов)
- **PWA:** vite-plugin-pwa

## Запуск проекта локально

1.  **Клонируйте репозиторий:**

    ```bash
    git clone https://github.com/wishhdd/listo.git
    cd listo
    ```

2.  **Переменные окружения:** для работы с бэкендом создайте файл `.env` с `VITE_API_URL=<URL API>`. Для деплоя по подпути задайте `VITE_BASE_PATH` (в prod по умолчанию `/listo/`).

3.  **Установите зависимости:**

    ```bash
    npm install
    ```

4.  **Запустите сервер разработки:**

    ```bash
    npm run dev
    ```

    Приложение будет доступно по адресу `http://localhost:5173`.

5.  **Сборка для продакшена (и проверка PWA):**
    ```bash
    npm run build
    npm run preview
    ```

## Структура проекта

```text
src/
├── api/              # HTTP-клиент (VITE_API_URL)
├── components/
│   ├── auth/         # Модалки входа, выхода, подтверждения
│   ├── home/         # Карточки списков, формы, шаринг, инвайты
│   ├── list/         # Элементы списка (Header, Input, SwipeItem, EditItem)
│   ├── layout/       # MainLayout
│   ├── pwa/          # Подсказка установки PWA
│   ├── sync/         # SyncManager (интервал + refocus → syncWithServer)
│   ├── ui/           # Базовые элементы (Button, IconWrapper)
│   └── views/        # Экраны: HomeView, SingleListView
├── store/            # Zustand: authStore, listStore, uiStore
├── hooks/            # useLocalStorage, usePWAInstall, useBackNavigation, useOnFocus, useInterval
├── types/            # TypeScript: TodoList, TodoItem, User, ListInvite, API-типы
├── utils/            # generateId, mergeItemsByNewer, theme, sortListsByPosition, notify
├── App.tsx           # Роутинг и провайдеры
└── main.tsx
```

- **Авторизация:** через **Zustand** (authStore): checkAuth по `/api/auth/checkAuth`, логин/регистрация/логаут.
- **Синхронизация:** данные в localStorage через **zustand persist** (ключ `listo`); при авторизации списки и элементы синхронизируются с бэкендом. SyncManager вызывает syncWithServer при монтировании (если user есть), по интервалу (30 с; 5 с для общего списка) и при возврате фокуса на вкладку. Merge по `updatedAt`; новые/изменённые сущности отправляются на сервер.

## Планы на будущее (Roadmap)

- [x] Этап 1: Базовая функциональность, PWA, LocalStorage.
- [x] Этап 2: Бэкенд и синхронизация списков между устройствами.
- [x] Совместное редактирование списков (общий доступ и синхронизация).
- [ ] Мгновенные обновления при совместном редактировании (WebSocket).

Бэкенд API расположен в отдельном репозитории/каталоге.

## Лицензия

Этот проект распространяется под лицензией MIT. Подробнее см. файл [LICENSE](LICENSE).
