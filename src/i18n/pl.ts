import { pluralPl as p } from './plural'
import type { GuideStep, Messages } from './en'

// Wording avoids gendered verb forms ("skupiałem/skupiałam") so it reads right for everyone.
export const pl: Messages = {
  units: {
    duration: (h, m) => (h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`),
    hours: (h) => `${h} h`,
    minutes: (m) => `${m} min`,
    seconds: (s) => `${s} s`,
    minutesLong: (m) => `${m} min`,
  },

  common: {
    cancel: 'Anuluj',
    add: 'Dodaj',
    keep: 'Zostaw',
    delete: 'Usuń',
    noTag: 'Bez tagu',
    today: 'Dziś',
    yesterday: 'Wczoraj',
    previous: 'Poprzedni',
    next: 'Następny',
    decrease: 'Zmniejsz',
    increase: 'Zwiększ',
    saveFailed: 'Nie udało się zapisać sesji. Spróbuj ponownie.',
  },

  tabs: { focus: 'Skupienie', forest: 'Las', stats: 'Statystyki', shop: 'Sklep', settings: 'Ustawienia' },

  periods: { day: 'Dzień', week: 'Tydzień', month: 'Miesiąc', year: 'Rok' },

  focus: {
    greeting: (hour) =>
      hour < 5 ? 'Nocna zmiana? 🌙'
      : hour < 12 ? 'Dzień dobry ☀️'
      : hour < 18 ? 'Miłego popołudnia 🌤'
      : 'Dobry wieczór 🌙',
    today: 'Dziś',
    ofGoal: (goal) => `z celu ${goal}`,
    streak: (n) => `🔥 ${n} ${p(n, 'dzień', 'dni', 'dni')}`,
    goalReached: 'Dzienny cel osiągnięty — świetna robota! 🎉',
    backupNever: 'Zrób kopię zapasową lasu, żeby nigdy go nie stracić',
    backupStale: 'Czas na świeżą kopię zapasową lasu',
    chooseTree: 'Wybierz drzewo',
    timer: 'Minutnik',
    stopwatch: 'Stoper',
    lengthLabel: 'Długość sesji w minutach',
    stopwatchHint: 'Liczy w górę, aż zatrzymasz. Drzewo dorasta w godzinę.',
    plant: 'Posadź',
    logForgotten: 'Dodaj czas ręcznie',
  },

  running: {
    growing: [
      'Twoje drzewo rośnie. Tak trzymaj 🌱',
      'Krok po kroku.',
      'Głęboki oddech. Dasz radę.',
      'Twoje przyszłe ja ci podziękuje.',
      'Z małych sesji rosną wielkie lasy.',
      'Najtrudniej zacząć — a to już masz za sobą.',
      'Spokojna głowa, mocne korzenie.',
      'Każda minuta się liczy.',
    ],
    done: 'Kończę',
    addTag: 'Dodaj tag',
    giveUp: 'Zrezygnuj',
    ruleAsk: 'Blokowanie telefonu jest OK — jeśli znikniesz na dłużej, zapytam, jak poszło.',
    ruleStrict: (min) => `Wyjdź na dłużej niż ${min} min, a drzewo uschnie.`,
    giveUpTitle: 'Zrezygnować z tego drzewa?',
    giveUpBody: 'Drzewo uschnie, a ta sesja nie wliczy się do czasu skupienia.',
    keepGrowing: 'Niech rośnie',
    tooShortTitle: 'Za krótko na drzewo',
    tooShortBody: 'Sesje krótsze niż minuta nie są zapisywane. Kontynuować czy odrzucić?',
    discard: 'Odrzuć',
    keepGoing: 'Kontynuuj',
    checkInTitle: 'Witaj z powrotem! 👋',
    checkInAway: 'Nie było cię przez',
    checkInQuestion: 'Czy to nadal był czas skupienia — zablokowany telefon, czytanie, notatki?',
    checkInYes: 'Tak, to był czas skupienia 🌱',
    checkInNo: 'Nie, coś mnie rozproszyło 🥀',
    checkInHonest: 'Uczciwie — to twój las.',
  },

  result: {
    planted: 'Drzewo posadzone!',
    withered: 'Twoje drzewo uschło',
    plantedMessages: [
      'Pięknie! Kolejne drzewo w twoim lesie 🌳',
      'Brawo — to było prawdziwe skupienie.',
      'Twój las jest coraz bardziej zielony!',
      'Świetna sesja. Zrób sobie krótką przerwę ☕',
      'Spójrz na to drzewo. Zasłużone.',
    ],
    witheredMessages: [
      'Zdarza się. Następne na pewno urośnie 🌱',
      'Nic nie szkodzi — posadź kolejne, kiedy zechcesz.',
      'Nawet lasy mają gorsze dni.',
    ],
    focused: (duration) => `${duration} skupienia`,
    back: 'Wróć do lasu',
    tryAgain: 'Spróbuj ponownie',
  },

  sessionForm: {
    addTitle: 'Dodaj czas skupienia',
    editTitle: 'Edytuj sesję',
    intro: 'Nauka bez minutnika? Dodaj ją tutaj — liczy się w statystykach i w lesie tak samo jak sesja z minutnikiem.',
    date: 'Data',
    startedAt: 'Początek',
    duration: 'Czas trwania',
    hoursLabel: 'Godziny',
    minutesLabel: 'Minuty',
    hoursOption: (h) => `${h} godz.`,
    minutesOption: (m) => `${m} min`,
    tag: 'Tag',
    tree: 'Drzewo',
    note: 'Notatka',
    notePlaceholder: 'Opcjonalnie — np. zadania z rozdziału 4',
    survived: 'Drzewo przetrwało',
    survivedHint: 'Uschnięte drzewa nie liczą się do czasu skupienia ani monet.',
    overlap: (n, ranges) =>
      `Uwaga: ta sesja nakłada się na ${p(n, 'inną sesję', `${n} inne sesje`, `${n} innych sesji`)} (${ranges}). Wspólny czas policzy się podwójnie.`,
    errorNoDate: 'Wybierz datę i godzinę rozpoczęcia.',
    errorZero: 'Czas trwania musi być dłuższy niż 0 minut.',
    errorTooLong: 'To ponad 16 godzin — podziel to na kilka sesji.',
    errorFuture: 'Ta sesja kończyłaby się w przyszłości.',
    save: 'Zapisz zmiany',
    addDuration: (duration) => `Dodaj ${duration}`,
    addSession: 'Dodaj sesję',
    keepIt: 'Zostaw',
    deleteForGood: 'Usuń na zawsze',
    deleteSession: 'Usuń sesję',
  },

  pickers: {
    tagPlaceholder: 'Nazwa tagu',
    newTag: 'Nowy tag',
    tagSheetTitle: 'Na czym się skupiasz?',
    treeSheetTitle: 'Wybierz drzewo',
    unlockMore: 'Więcej drzew odblokujesz w sklepie za zdobyte monety.',
  },

  forest: {
    title: 'Mój las',
    source: { timer: null, manual: 'ręcznie', import: 'import' },
    manualMark: 'Dodane ręcznie',
    sessionLabel: (duration) => `Sesja ${duration}`,
    groundLabel: 'Drzewa posadzone w tym okresie',
    empty: 'Jeszcze tu pusto. Posadź drzewo albo dodaj czas ręcznie.',
    more: (n) => `+ jeszcze ${n} ${p(n, 'drzewo', 'drzewa', 'drzew')}`,
    trees: (n) => `${n} ${p(n, 'drzewo', 'drzewa', 'drzew')}`,
    focused: 'skupienia',
    withered: (n) => `${n} ${p(n, 'uschnięte', 'uschnięte', 'uschniętych')}`,
    logTime: 'Dodaj czas skupienia',
  },

  stats: {
    title: 'Statystyki',
    focused: 'Łączny czas skupienia',
    delta: (pct, period, partial) => {
      const full = { day: 'wczoraj', week: 'zeszły tydzień', month: 'zeszły miesiąc', year: 'zeszły rok' }
      const samepoint = {
        day: 'wczoraj o tej porze',
        week: 'ten sam moment zeszłego tygodnia',
        month: 'ten sam moment zeszłego miesiąca',
        year: 'ten sam moment zeszłego roku',
      }
      return `${pct}% vs ${(partial ? samepoint : full)[period]}`
    },
    planted: 'Posadzone drzewa',
    withered: 'Uschnięte',
    dailyAverage: 'Średnio dziennie',
    streak: 'Obecna seria',
    days: (n) => `${n} ${p(n, 'dzień', 'dni', 'dni')}`,
    chartTitle: 'Czas skupienia',
    byTag: 'Według tagów',
    nothing: 'Jeszcze nic tu nie ma.',
    tapBar: 'Dotknij słupka, by zobaczyć szczegóły',
    chartLabel: 'Czas skupienia w kolejnych okresach',
  },

  shop: {
    title: 'Sklep',
    yourCoins: 'Twoje monety',
    earnHint: 'Za każdą minutę skupienia dostajesz 1 monetę.',
    trees: 'Drzewa',
    themes: 'Motywy',
    inUse: 'W użyciu',
    owned: 'Kupione · dotknij, by użyć',
    unlockTree: 'Odblokować to drzewo?',
    unlockTheme: 'Odblokować ten motyw?',
    costs: 'Koszt',
    youHave: (n) => `masz ${n}`,
    missing: (n, hours) =>
      `Brakuje ${n.toLocaleString('pl')} ${n === 1 ? 'monety' : 'monet'} — to ok. ${hours} ${p(hours, 'godzina', 'godziny', 'godzin')} skupienia.`,
    notEnough: 'Za mało monet — skupiaj się dalej!',
    unlock: 'Odblokuj',
  },

  settings: {
    title: 'Ustawienia',
    language: 'Język',
    leaving: 'Wychodzenie z aplikacji',
    penaltyModes: { off: 'Wył.', ask: 'Pytaj', strict: 'Surowo' },
    penaltyHelp: {
      off: 'Wychodzenie z aplikacji nigdy nie szkodzi drzewu.',
      ask: 'Gdy wrócisz po dłuższej nieobecności, zapytam, czy to nadal był czas skupienia. Zablokowanie telefonu podczas nauki jest w porządku.',
      strict: 'Drzewo usycha, jeśli nie ma cię dłużej niż limit poniżej — niezależnie od tego, czy telefon był zablokowany.',
    },
    grace: 'Zawsze wybaczaj',
    graceHint: 'Krótkie zerknięcia poniżej tego czasu nigdy się nie liczą.',
    strictLimit: 'Usycha po',
    strictLimitHint: 'Czas nieobecności, po którym drzewo usycha.',
    goals: 'Cele i nagrody',
    dailyGoal: 'Dzienny cel',
    manualCoins: 'Ręcznie dodany czas daje monety',
    manualCoinsHint: 'Dotyczy sesji dodanych lub edytowanych od teraz.',
    sound: 'Dźwięk, gdy drzewo wyrośnie',
    footer: 'Better Forest · twoje dane zostają na tym urządzeniu',
  },

  deepFocus: {
    title: 'Blokowanie rozpraszających aplikacji',
    hint: 'Aplikacja webowa nie może blokować innych aplikacji, ale twój iPhone już tak — dzięki trybowi skupienia i automatyzacji w Skrótach. Konfiguracja zajmuje ok. 5 minut.',
    button: 'Pokaż, jak to zrobić',
    intro: 'Gdy włączony jest tryb skupienia „Nauka”, otwarcie zablokowanej aplikacji od razu przeniesie cię na ekran początkowy. Aplikacje, których nie wybierzesz — np. ChatGPT, Gemini czy Safari — działają normalnie.',
    steps: [
      {
        title: 'Utwórz tryb skupienia „Nauka”',
        body: 'Ustawienia → Skupienie → + → Własny. Nazwij go „Nauka”. Opcjonalnie zezwól na powiadomienia tylko z aplikacji do nauki.',
      },
      {
        title: 'Utwórz automatyzację',
        body: 'Aplikacja Skróty → Automatyzacja → + → Aplikacja. Stuknij „Wybierz” i zaznacz wszystkie aplikacje, które chcesz blokować — możesz zaznaczyć wiele naraz. Pomiń ChatGPT, Gemini, Safari i Better Forest. Potem wybierz „Jest otwarta” i „Uruchom natychmiast”, a „Powiadom po uruchomieniu” wyłącz.',
      },
      {
        title: 'Dodaj czynności',
        body: 'Stuknij „Nowa pusta automatyzacja” i dodaj po kolei te czynności:',
        actions: [
          'Pobierz bieżące skupienie',
          'Jeżeli — bieżące skupienie to „Nauka”',
          'Pokaż powiadomienie: „🌳 Twoje drzewo rośnie — wracaj do nauki!”',
          'Przejdź do ekranu początkowego',
          'Koniec warunku Jeżeli',
        ],
      },
      {
        title: 'Korzystaj',
        body: 'Zanim posadzisz drzewo, włącz „Nauka” w Centrum sterowania. Przytrzymaj przycisk i wybierz „Przez 1 godzinę”, żeby tryb wyłączył się sam.',
      },
    ] as GuideStep[],
    tipsTitle: 'Warto wiedzieć',
    tips: [
      'Połącz to z trybem „Pytaj” powyżej: możesz zajrzeć do ChatGPT, a po powrocie stuknąć „Tak”. Unikaj trybu „Surowo” — nie odróżni ChatGPT od Instagrama.',
      'Zablokowana aplikacja może mignąć na ułamek sekundy, zanim wrócisz na ekran początkowy. Przetestuj to raz na jakiejś rozpraszającej aplikacji.',
      'Nazwy przycisków i czynności mogą się nieco różnić w zależności od wersji iOS.',
    ],
  },

  tags: {
    title: 'Tagi',
    empty: 'Nie masz jeszcze tagów. Tagi pokazują, na co idzie twój czas, np. „Matematyka” albo „Praca dyplomowa”.',
    nameLabel: 'Nazwa tagu',
    deleteLabel: (name) => `Usuń tag ${name}`,
  },

  data: {
    title: 'Twoje dane',
    explainer: 'Wszystko jest zapisane na tym telefonie. Usunięcie aplikacji z ekranu początkowego (albo wyczyszczenie danych witryn) je kasuje, więc co jakiś czas eksportuj kopię zapasową — z arkusza udostępniania zapisz ją na iCloud Drive.',
    lastBackup: (date) => `Ostatnia kopia: ${date}`,
    noBackup: 'Nie ma jeszcze kopii zapasowej.',
    persisted: 'Pamięć jest chroniona przed automatycznym czyszczeniem.',
    notPersisted: 'Brak ochrony pamięci przed czyszczeniem.',
    export: 'Eksportuj kopię zapasową',
    restore: 'Przywróć z kopii…',
    importForest: 'Importuj z aplikacji Forest (CSV)…',
    erase: 'Usuń wszystkie dane…',
    eraseWarning: (n) =>
      `To usunie ${p(n, 'jedyną sesję', `wszystkie ${n} sesje`, `wszystkie ${n} sesji`)}, tagi, monety i odblokowania. Nie da się tego cofnąć.`,
    eraseConfirm: 'Usuń wszystko',
    restored: (n) => `Przywrócono ${n} ${p(n, 'sesję', 'sesje', 'sesji')}.`,
    errorInvalidJson: 'Ten plik nie jest poprawnym plikiem JSON.',
    errorNotBackup: 'To nie wygląda na kopię zapasową Better Forest.',
    restoreTitle: 'Przywrócić kopię?',
    restoreSummary: (date, sessions, tags) =>
      `Kopia z ${date}: ${sessions} ${p(sessions, 'sesja', 'sesje', 'sesji')} i ${tags} ${p(tags, 'tag', 'tagi', 'tagów')}.`,
    restoreWarning: (n) => `To zastąpi wszystko, co jest teraz w aplikacji (${n} ${p(n, 'sesja', 'sesje', 'sesji')}).`,
    restoreConfirm: 'Przywróć',
  },

  forestImport: {
    title: 'Import z Forest',
    found: (n, from, to, trees, withered, total) =>
      `Znaleziono ${n} ${p(n, 'sesję', 'sesje', 'sesji')} z okresu ${from} – ${to}: ${trees} ${p(trees, 'drzewo', 'drzewa', 'drzew')}, ${withered} ${p(withered, 'uschnięte', 'uschnięte', 'uschniętych')}, łącznie ${total} skupienia.`,
    tags: (list) => `Tagi: ${list}`,
    firstSession: (range) =>
      `Pierwsza sesja: ${range}. Jeśli godzina wygląda na przesuniętą, anuluj — format daty w pliku może wymagać poprawki.`,
    nothingFound: 'Nie udało się odczytać żadnej sesji z tego pliku.',
    skipped: (n) => `Pominięto ${n} ${p(n, 'wiersz', 'wiersze', 'wierszy')}:`,
    line: (line, reason) => `Wiersz ${line}: ${reason}`,
    noDuplicates: 'Ponowny import tego samego pliku nie utworzy duplikatów.',
    confirm: (n) => `Importuj ${n} ${p(n, 'sesję', 'sesje', 'sesji')}`,
    doneTitle: 'Import zakończony 🌳',
    added: (added, updated) =>
      `Dodano ${added} ${p(added, 'sesję', 'sesje', 'sesji')}.` + (updated > 0 ? ` Zaktualizowano wcześniej zaimportowane: ${updated}.` : ''),
    newTags: (list) => `Nowe tagi: ${list}`,
    nice: 'Super',
    errors: {
      empty: 'Plik jest pusty.',
      columns: (header) => `Nie znaleziono kolumn z początkiem i końcem sesji. Nagłówek: ${header}`,
      date: (value) => `Nieczytelna data „${value}”`,
      order: 'Koniec nie jest późniejszy niż początek',
    },
  },

  species: {
    oak: { name: 'Dąb', blurb: 'Stały i mocny. Klasyka.' },
    pine: { name: 'Sosna', blurb: 'Wiecznie zielone skupienie.' },
    birch: { name: 'Brzoza', blurb: 'Lekka, jasna i smukła.' },
    sunflower: { name: 'Słonecznik', blurb: 'Zawsze zwrócony ku światłu.' },
    cherry: { name: 'Kwitnąca wiśnia', blurb: 'Delikatne różowe płatki na spokojne sesje.' },
    cactus: { name: 'Kaktus', blurb: 'Poradzi sobie nawet z najsuchszym materiałem.' },
    maple: { name: 'Jesienny klon', blurb: 'Ciepłe kolory na przytulne wieczory.' },
    palm: { name: 'Palma', blurb: 'Małe wakacje dla twojego mózgu.' },
    mushroom: { name: 'Muchomor', blurb: 'Rośnie po cichu w cieniu.' },
    lavender: { name: 'Glicynia', blurb: 'Rzadka i rozmarzona.' },
    spruce: { name: 'Ośnieżony świerk', blurb: 'Przyprószony świeżym śniegiem.' },
    golden: { name: 'Złote drzewo', blurb: 'Dla najbardziej wytrwałych.' },
  },

  themes: {
    meadow: 'Łąka',
    autumn: 'Jesień',
    winter: 'Zima',
    sakura: 'Sakura',
    night: 'Nocny las',
  },
}
