Oto poprawiona wersja:

# Najpotężniejsze AI w Minecraft – Twój Osobisty Bot z AI

Wyobraź sobie bota w Minecraft, który rozumie każde Twoje polecenie, jakbyś rozmawiał z przyjacielem. Bot, który potrafi automatycznie zbierać zasoby, walczyć z wrogami, kraftować przedmioty i reagować na Twoje potrzeby bez konieczności wpisywania skomplikowanych komend. Nasz Minecraft Bot z integracją AI to potężne narzędzie, które spełni każde Twoje zadanie — od prostych czynności po najbardziej skomplikowane misje w świecie Minecrafta.

## Dlaczego ten bot jest wyjątkowy?

Ten bot to coś więcej niż zwykłe narzędzie. To Twoje osobiste AI, które:

- **Rozumie język naturalny**: Nie musisz się męczyć z komendami, wystarczy, że powiesz, co chcesz zrobić.
- **Automatyzuje każdą czynność**: Od walki z potworami, przez zbieranie zasobów, po budowanie epickich konstrukcji.
- **Reaguje inteligentnie**: Dzięki AI bot dostosowuje się do sytuacji w grze i proponuje optymalne rozwiązania.
- **Pracuje dla Ciebie**: Niezależnie, czy chcesz eksplorować, budować czy walczyć, bot zrealizuje to na jedno polecenie.

## Główne funkcje

- **Walka z mobami**: Zaatakuj najbliższego moba lub wybierz określony typ przeciwnika.
- **Automatyczne zbieranie**: Bot zajmie się zbieraniem zasobów za Ciebie.
- **Kraftowanie**: Zleć botowi stworzenie dowolnych przedmiotów, a on dostarczy Ci gotowe narzędzia, bronie czy materiały budowlane.
- **Zarządzanie piecem**: Automatyzuj pracę w piecu, przetapiaj surowce i zarządzaj zasobami.
- **Pathfinding i eksploracja**: Bot znajdzie drogę do dowolnej lokalizacji lub gracza na serwerze.
- **Niestandardowe akcje**: Bot zrealizuje nawet najbardziej nietypowe komendy.
- **Inteligentna integracja z AI**: Wykorzystując technologię OpenAI lub Groq, bot rozumie sens i kontekst Twoich poleceń i przekształca je w konkretne działania.

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

   W głównym katalogu projektu uzupełnij plik `.env` następującymi danymi (GROQ or OPENAI):

   ```env
   GROQ_API_ENDPOINT="https://api.groq.com/openai/v1/chat/completions"
   GROQ_API_KEY="twój klucz api"

   AI_PROVIDER="groq" # groq albo openai

   OPENAI_API_ENDPOINT="https://api.openai.com/v1/chat/completions"
   OPENAI_API_KEY="twój klucz api"
   ```

   Wprowadź swoje klucze API dla `GROQ_API_KEY` i/lub `OPENAI_API_KEY` w zależności od wybranego dostawcy AI.

   [Zdobądź klucz API Groq tutaj.](https://console.groq.com/keys)  
   [Zdobądź klucz API OpenAI tutaj.](https://platform.openai.com/usage)

5. **Uruchom bota**:

   W terminalu wpisz:

   ```bash
   yarn start
   ```

   Bot jest teraz gotowy do działania w Twoim świecie Minecraft!

## Jak używać bota w grze?

Aby komunikować się z botem w grze, po prostu napisz na czacie Minecrafta komendę w formacie:

```bash
! <polecenie>
```

Przykładowe Funkcje Bota:

- **! zbierz drewno**: Bot automatycznie zbierze drewno dla Ciebie.

attackNearestMob.ts
clearNearestFurnace.ts
collectBlock.ts
craftRecipe.ts
createNetherPortal.ts
defendSelf.ts
eat.ts
findNearestPlayer.ts
fire.ts
moveAway.ts
moveToPlayer.ts
pickupNearbyItems.ts
placeBlock.ts
sendWelomeMessage.ts
sleep.ts
sleepInBed.ts
smeltItem.ts

Bot zrozumie Twoje polecenie i natychmiast przystąpi do działania!
