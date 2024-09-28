![Alt Text](https://i.ibb.co/GcYgsMR/repositofrtdry-open-graph-template.png)

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

   ```bash
   cd najpotezniejsze_AI
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

   Wprowadź swoje klucze API dla [`GROQ_API_KEY`](https://console.groq.com/keys) i/lub [`OPENAI_API_KEY`](https://platform.openai.com/usage) w zależności od wybranego dostawcy AI.

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

# Przykładowe Komendy Bota Minecraft

Poniżej znajduje się tabela z przykładowymi komendami dla bota w Minecraft. Wpisz komendę na czacie gry, zaczynając od "!":

**Ważna informacja:** Gdy wyznacza się botowi cel, będzie on kontynuował działania aż do jego osiągnięcia. Na przykład, komenda "! zrób żelazny kilof" spowoduje, że bot będzie wykonywał wszystkie niezbędne kroki (wydobycie żelaza, zebranie drewna, stworzenie pieca, przetopienie rudy, itp.) aż do momentu stworzenia żelaznego kilofa. Bot nie zatrzyma się, dopóki nie osiągnie wyznaczonego celu lub nie napotka przeszkody nie do pokonania.

| Komenda              | Opis działania                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ! atakuj moba        | Bot zaatakuje najbliższego moba.                                                                                                     |
| ! wyczyść piec       | Bot wyczyści zawartość najbliższego pieca.                                                                                           |
| ! zbierz blok        | Bot zbierze określony blok w pobliżu.                                                                                                |
| ! stwórz przedmiot   | Bot stworzy określony przedmiot, wykonując wszystkie niezbędne kroki.                                                                |
| ! stwórz portal      | Bot zbuduje portal do netheru, zbierając potrzebne materiały.                                                                        |
| ! broń się           | Bot będzie bronił się przed atakami mobów.                                                                                           |
| ! jedz               | Bot zje jedzenie ze swojego ekwipunku, jeśli jest głodny.                                                                            |
| ! znajdź gracza      | Bot będzie szukał najbliższego gracza.                                                                                               |
| ! rozpal ogień       | Bot rozpali ogień w określonym miejscu, zbierając potrzebne materiały.                                                               |
| ! pokaż przepis      | Bot wyświetli przepis na określony przedmiot.                                                                                        |
| ! odejdź             | Bot oddali się od obecnej lokalizacji.                                                                                               |
| ! idź do gracza      | Bot podejdzie do określonego gracza.                                                                                                 |
| ! podnieś przedmioty | Bot podniesie pobliskie przedmioty.                                                                                                  |
| ! postaw blok        | Bot postawi blok w określonym miejscu.                                                                                               |
| ! przywitaj się      | Bot wyśle wiadomość powitalną na czacie.                                                                                             |
| ! śpij               | Bot pójdzie spać, jeśli jest noc i znajduje się w pobliżu łóżka.                                                                     |
| ! śpij w łóżku       | Bot znajdzie najbliższe łóżko i położy się spać.                                                                                     |
| ! przetop przedmiot  | Bot przetopi określony przedmiot w piecu, wykonując wszystkie niezbędne kroki.                                                       |
| ! wyrzuć przedmiot   | Bot wyrzuci określony przedmiot ze swojego ekwipunku.                                                                                |
| ! zrób żelazny kilof | Bot wykona wszystkie niezbędne kroki, aby stworzyć żelazny kilof, włącznie z wydobyciem surowców i stworzeniem potrzebnych narzędzi. |

Pamiętaj, że bot będzie dążył do wykonania zadania, nawet jeśli wymaga to wielu kroków i czasu. To zachowanie pozwala na automatyzację złożonych zadań w grze.

Bot zrozumie Twoje polecenie i natychmiast przystąpi do działania!
