# Najpotężniejszy Minecraft Bot z Wykorzystaniem AI

Wyobraź sobie bota w Minecraft, który rozumie każde Twoje polecenie, jakbyś rozmawiał z przyjacielem. Bot, który potrafi automatycznie zbierać zasoby, walczyć z wrogami, kraftować przedmioty i reagować na Twoje potrzeby bez konieczności wpisywania skomplikowanych komend. Właśnie tym jest nasz Minecraft Bot z integracją AI! Dzięki potężnym technologiom, takim jak OpenAI i Groq, ten bot jest w stanie zrealizować dosłownie każde zadanie, które mu powierzysz — od najprostszych czynności po najbardziej złożone misje w świecie Minecrafta.

## Dlaczego ten bot jest wyjątkowy?

Ten bot to coś więcej niż narzędzie. To Twoje osobiste AI, które:

- **Rozumie język naturalny**: Nie musisz się męczyć z komendami, wystarczy, że powiesz, co chcesz zrobić.
- **Automatyzuje każdą czynność**: Czy to walka z potworami, zbieranie zasobów, budowanie struktur czy kraftowanie — bot zrobi to wszystko za Ciebie.
- **Reaguje inteligentnie**: Dzięki integracji z AI, bot nie tylko rozumie, co mówisz, ale również dostosowuje się do sytuacji w grze, proponując optymalne rozwiązania.
- **Pracuje dla Ciebie**: Chcesz eksplorować świat, budować epickie konstrukcje czy walczyć z hordą wrogów? Bot zrobi to wszystko za jednym poleceniem!

## Główne funkcje

- **Walka z mobami**: Zaatakuj najbliższego moba lub skoncentruj się na określonym typie przeciwnika.
- **Automatyczne zbieranie**: Zbierz zasoby bez klikania — bot zajmie się tym za Ciebie.
- **Kraftowanie**: Zleć botowi stworzenie dowolnych przedmiotów, a on dostarczy Ci gotowe narzędzia, bronie czy materiały budowlane.
- **Zarządzanie piecem**: Przetapiaj surowce, zarządzaj zasobami i automatyzuj pracę w piecu.
- **Pathfinding i eksploracja**: Bot znajdzie drogę do dowolnej lokalizacji lub gracza na serwerze.
- **Niestandardowe akcje**: Każda komenda, nawet ta najbardziej nietypowa, zostanie zrealizowana.
- **Inteligentna integracja z AI**: Dzięki technologii OpenAI lub Groq, bot przekształca Twoje słowa w konkretne działania, rozumiejąc sens i kontekst Twoich poleceń.

## Jak zacząć?


1. **Sklonuj repozytorium**:

   ```bash
   git clone https://github.com/MateuszMichura/najpotezniejsze_AI.git
   ```

2. **Zainstaluj Yarn globalnie**:

   Otwórz wiersz poleceń (cmd) i wpisz:

   ```bash
   npm install -g yarn
   ```

3. **Zainstaluj zależności projektu**:

   Przejdź do folderu projektu w Visual Studio Code, otwórz terminal i wpisz:

   ```bash
   yarn install
   ```

4. **Uzupełnij plik konfiguracyjny `.env`**:

   W głównym katalogu projektu utwórz plik `.env` i wprowadź następujące dane:

   ```env
   GROQ_API_ENDPOINT="https://api.groq.com/openai/v1/chat/completions"
   GROQ_API_KEY=""

   AI_PROVIDER="groq" # groq albo openai

   OPENAI_API_ENDPOINT="https://api.openai.com/v1/chat/completions"
   OPENAI_API_KEY=""
   ```

   Uzupełnij `GROQ_API_KEY` i/lub `OPENAI_API_KEY` swoimi kluczami API w zależności od wybranego dostawcy AI.

5. **Uruchom bota**:

   W terminalu wpisz:

   ```bash
   yarn start
   ```

   Bot jest teraz gotowy do działania w Twoim świecie Minecraft!

---

Ciesz się nowym poziomem rozgrywki w Minecraft dzięki naszemu inteligentnemu botowi!
```
