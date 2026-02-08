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
- **PWA:** vite-plugin-pwa

## Запуск проекта локально

1.  **Клонируйте репозиторий:**

    ```bash
    git clone https://github.com/wishhdd/listo.git
    cd listo
    ```

2.  **Установите зависимости:**

    ```bash
    npm install
    ```

3.  **Запустите сервер разработки:**

    ```bash
    npm run dev
    ```

    Приложение будет доступно по адресу `http://localhost:5173`.

4.  **Сборка для продакшена (и проверка PWA):**
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
│   ├── pwa/          # Подсказка установки PWA
│   ├── ui/           # Базовые элементы (Button, IconWrapper)
│   └── views/        # Экраны: HomeView, SingleListView
├── context/          # AuthContext (user, login, logout)
├── hooks/            # useAuth, useLocalStorage, useSync, useAutoSync, useInvites, useLists, usePWAInstall, useBackNavigation
├── types/            # TypeScript: TodoList, TodoItem, User, ListInvite, API-типы
├── utils/            # generateId, mergeItemsByNewer, theme, sortListsByPosition
├── App.tsx           # Роутинг и провайдеры
└── main.tsx
```

- **Авторизация:** через AuthContext; проверка сессии по `/api/auth/checkAuth`; логин/регистрация/логаут.
- **Синхронизация:** данные хранятся в localStorage (ключ `listo`); при наличии пользователя списки и элементы синкаются с бэкендом (useSync, useAutoSync). Merge по `updatedAt`; новые/изменённые сущности пушатся на сервер.

## Планы на будущее (Roadmap)

- [x] Этап 1: Базовая функциональность, PWA, LocalStorage.
- [x] Этап 2: Бэкенд и синхронизация списков между устройствами.
- [x] Совместное редактирование списков (общий доступ и синхронизация).
- [ ] Мгновенные обновления при совместном редактировании (WebSocket).

## Лицензия

Этот проект распространяется под лицензией MIT. Подробнее см. файл [LICENSE](LICENSE).
