import { pluralEn as p } from './plural'
import type { SpeciesId } from '../data/species'
import type { ThemeId } from '../data/themes'
import type { Period } from '../lib/time'
import type { PenaltyMode, SessionSource } from '../types'

export interface GuideStep {
  title: string
  body: string
  /** Shortcut actions to add, in order. */
  actions?: string[]
}

// The English dictionary is the source of truth: its shape is the `Messages` type that
// every other language has to match exactly, so a missing translation is a type error.
export const en = {
  units: {
    /** Short duration: "1h 25m", "25m", "2h". */
    duration: (h: number, m: number) => (h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`),
    /** Chart axis labels; the number is already formatted for the locale. */
    hours: (h: string) => `${h}h`,
    minutes: (m: string) => `${m}m`,
    seconds: (s: number) => `${s}s`,
    minutesLong: (m: number) => `${m} min`,
  },

  common: {
    cancel: 'Cancel',
    add: 'Add',
    keep: 'Keep',
    delete: 'Delete',
    noTag: 'No tag',
    today: 'Today',
    yesterday: 'Yesterday',
    previous: 'Previous',
    next: 'Next',
    decrease: 'Decrease',
    increase: 'Increase',
    saveFailed: 'Couldn’t save this session. Please try again.',
  },

  tabs: { focus: 'Focus', forest: 'Forest', stats: 'Stats', shop: 'Shop', settings: 'Settings' },

  periods: { day: 'Day', week: 'Week', month: 'Month', year: 'Year' } satisfies Record<Period, string>,

  focus: {
    greeting: (hour: number): string =>
      hour < 5 ? 'Burning the midnight oil 🌙'
      : hour < 12 ? 'Good morning ☀️'
      : hour < 18 ? 'Good afternoon 🌤'
      : 'Good evening 🌙',
    today: 'Today',
    ofGoal: (goal: string) => `of ${goal} goal`,
    streak: (n: number) => `🔥 ${n} ${p(n, 'day', 'days')}`,
    goalReached: 'Daily goal reached — amazing work! 🎉',
    backupNever: 'Back up your forest so it’s never lost',
    backupStale: 'Time for a fresh backup of your forest',
    chooseTree: 'Choose tree',
    timer: 'Timer',
    stopwatch: 'Stopwatch',
    lengthLabel: 'Session length in minutes',
    stopwatchHint: 'Counts up until you stop. Fully grown after an hour.',
    plant: 'Plant',
    logForgotten: 'Log time I forgot to track',
  },

  running: {
    growing: [
      'Your tree is growing. Keep going 🌱',
      'One step at a time.',
      'Deep breath. You’ve got this.',
      'Future you says thanks.',
      'Small sessions grow big forests.',
      'The hard part is starting — and you already did.',
      'Quiet mind, steady roots.',
      'Every minute counts.',
    ],
    done: 'I’m done',
    addTag: 'Add a tag',
    giveUp: 'Give up',
    ruleAsk: 'Locking your phone is fine — if you’re away a while, I’ll ask how it went.',
    ruleStrict: (min: number) => `Away for more than ${min} min and your tree withers.`,
    giveUpTitle: 'Give up on this tree?',
    giveUpBody: 'Your tree will wither and this session won’t count towards your focus time.',
    keepGrowing: 'Keep growing',
    tooShortTitle: 'Too short for a tree',
    tooShortBody: 'Sessions under a minute aren’t saved. Keep going, or discard this one?',
    discard: 'Discard',
    keepGoing: 'Keep going',
    checkInTitle: 'Welcome back! 👋',
    checkInAway: 'You were away for',
    checkInQuestion: 'Were you still focusing — phone locked, reading, writing notes?',
    checkInYes: 'Yes, I was focusing 🌱',
    checkInNo: 'I got distracted 🥀',
    checkInHonest: 'Be honest — it’s your forest.',
  },

  result: {
    planted: 'Tree planted!',
    withered: 'Your tree withered',
    plantedMessages: [
      'Beautiful! Another tree for your forest 🌳',
      'Well done — that was real focus.',
      'Your forest is getting greener!',
      'Great session. Take a little break ☕',
      'Look at that tree. You earned it.',
    ],
    witheredMessages: [
      'It happens. The next one will make it 🌱',
      'No worries — plant another when you’re ready.',
      'Even forests have bad days.',
    ],
    focused: (duration: string) => `${duration} focused`,
    back: 'Back to my forest',
    tryAgain: 'Try again',
  },

  sessionForm: {
    addTitle: 'Log focus time',
    editTitle: 'Edit session',
    intro: 'Studied without the timer? Add it here and it counts in your stats and forest just like a timed session.',
    date: 'Date',
    startedAt: 'Started at',
    duration: 'Duration',
    hoursLabel: 'Hours',
    minutesLabel: 'Minutes',
    hoursOption: (h: number) => `${h} h`,
    minutesOption: (m: number) => `${m} min`,
    tag: 'Tag',
    tree: 'Tree',
    note: 'Note',
    notePlaceholder: 'Optional — e.g. Chapter 4 exercises',
    survived: 'Tree survived',
    survivedHint: 'Withered trees don’t count towards focus time or coins.',
    overlap: (n: number, ranges: string) =>
      `Heads up: this overlaps ${p(n, 'another session', `${n} other sessions`)} (${ranges}). Overlapping time is counted twice.`,
    errorNoDate: 'Pick a date and start time.',
    errorZero: 'Duration must be more than 0 minutes.',
    errorTooLong: 'That’s more than 16 hours — split it into a few sessions.',
    errorFuture: 'This session would end in the future.',
    save: 'Save changes',
    addDuration: (duration: string) => `Add ${duration}`,
    addSession: 'Add session',
    keepIt: 'Keep it',
    deleteForGood: 'Delete for good',
    deleteSession: 'Delete session',
  },

  pickers: {
    tagPlaceholder: 'Tag name',
    newTag: 'New tag',
    tagSheetTitle: 'What are you focusing on?',
    treeSheetTitle: 'Choose your tree',
    unlockMore: 'Unlock more trees in the shop with the coins you earn.',
  },

  forest: {
    title: 'My Forest',
    source: { timer: null, manual: 'logged', import: 'imported' } as Record<SessionSource, string | null>,
    manualMark: 'Logged manually',
    sessionLabel: (duration: string) => `${duration} session`,
    groundLabel: 'Trees planted in this period',
    empty: 'No trees here yet. Plant one, or log time you forgot to track.',
    more: (n: number) => `+ ${n} more ${p(n, 'tree', 'trees')}`,
    trees: (n: number) => `${n} ${p(n, 'tree', 'trees')}`,
    focused: 'focused',
    withered: (n: number) => `${n} withered`,
    logTime: 'Log focus time',
  },

  stats: {
    title: 'Statistics',
    focused: 'Focused',
    /** "▲ 20% vs last week"; `partial` when comparing with the same point of the previous period. */
    delta: (pct: number, period: Period, partial: boolean) => {
      const prev = { day: 'yesterday', week: 'last week', month: 'last month', year: 'last year' }[period]
      return `${pct}% vs ${partial ? 'this point ' : ''}${prev}`
    },
    planted: 'Trees planted',
    withered: 'Withered',
    dailyAverage: 'Daily average',
    streak: 'Current streak',
    days: (n: number) => `${n} ${p(n, 'day', 'days')}`,
    chartTitle: 'Focus time',
    byTag: 'By tag',
    nothing: 'Nothing here yet.',
    tapBar: 'Tap a bar for details',
    chartLabel: 'Focus time per period',
  },

  shop: {
    title: 'Shop',
    yourCoins: 'Your coins',
    earnHint: 'You earn 1 coin for every minute of focus.',
    trees: 'Trees',
    themes: 'Themes',
    inUse: 'In use',
    owned: 'Owned · tap to use',
    unlockTree: 'Unlock this tree?',
    unlockTheme: 'Unlock this theme?',
    costs: 'Costs',
    youHave: (n: string) => `you have ${n}`,
    missing: (n: number, hours: number) =>
      `${n.toLocaleString('en')} more ${p(n, 'coin', 'coins')} — about ${hours} ${p(hours, 'hour', 'hours')} of focus.`,
    notEnough: 'Not enough coins yet — keep focusing!',
    unlock: 'Unlock',
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    leaving: 'Leaving the app',
    penaltyModes: { off: 'Off', ask: 'Ask me', strict: 'Strict' } satisfies Record<PenaltyMode, string>,
    penaltyHelp: {
      off: 'Leaving the app never hurts your tree.',
      ask: 'When you come back after being away, you’ll be asked whether you were still focusing. Locking your phone to study is totally fine.',
      strict: 'Your tree withers if you’re away for longer than the limit below — locked phone or not.',
    } satisfies Record<PenaltyMode, string>,
    grace: 'Always forgive',
    graceHint: 'Quick peeks shorter than this never count.',
    strictLimit: 'Wither after',
    strictLimitHint: 'Time away before the tree dies.',
    goals: 'Goals & rewards',
    dailyGoal: 'Daily goal',
    manualCoins: 'Logged time earns coins',
    manualCoinsHint: 'Applies to sessions you add or edit from now on.',
    sound: 'Sound when a tree is done',
    footer: 'Lesisko · your data stays on this device',
  },

  deepFocus: {
    title: 'Block distracting apps',
    hint: 'A web app can’t block other apps, but your iPhone can — with a Focus mode and a Shortcuts automation. It takes about 5 minutes to set up.',
    button: 'Show me how',
    intro: 'While a Focus mode called “Study” is on, opening a blocked app sends you straight back to the Home Screen. Apps you don’t pick — like ChatGPT, Gemini or Safari — keep working.',
    steps: [
      {
        title: 'Create the “Study” Focus',
        body: 'Settings → Focus → + → Custom. Name it “Study”. Optionally, allow notifications only from your study apps.',
      },
      {
        title: 'Create the automation',
        body: 'Shortcuts app → Automation → + → App. Tap Choose and select every app you want blocked — you can pick many at once. Leave out ChatGPT, Gemini, Safari and Lesisko. Then pick “Is Opened” and “Run Immediately”, and turn off “Notify When Run”.',
      },
      {
        title: 'Add the actions',
        body: 'Tap New Blank Automation and add these actions in order:',
        actions: [
          'Get Current Focus',
          'If — Current Focus is “Study”',
          'Show Notification: “🌳 Your tree is growing — back to work!”',
          'Go to Home Screen',
          'End If',
        ],
      },
      {
        title: 'Use it',
        body: 'Before you plant a tree, turn on Study in Control Center. Long-press it and choose “For 1 hour” so it switches itself off.',
      },
    ] as GuideStep[],
    tipsTitle: 'Good to know',
    tips: [
      'Use it with “Ask me” mode above: you can pop over to ChatGPT, then tap “Yes” when you come back. Avoid Strict mode — it can’t tell ChatGPT from Instagram.',
      'A blocked app may flash for a split second before you’re sent back. Test it once with a distracting app.',
      'Button and action names can differ slightly between iOS versions.',
    ],
  },

  tags: {
    title: 'Tags',
    empty: 'No tags yet. Tags let you see where your time goes, e.g. “Math” or “Thesis”.',
    nameLabel: 'Tag name',
    deleteLabel: (name: string) => `Delete ${name}`,
  },

  data: {
    title: 'Your data',
    explainer: 'Everything is saved on this phone. Deleting the app from your Home Screen (or clearing website data) erases it, so export a backup now and then — save it to iCloud Drive from the share sheet.',
    lastBackup: (date: string) => `Last backup: ${date}`,
    noBackup: 'No backup yet.',
    persisted: 'Storage is protected from automatic cleanup.',
    notPersisted: 'Storage protection not granted.',
    export: 'Export backup',
    restore: 'Restore from backup…',
    importForest: 'Import from Forest app (CSV)…',
    erase: 'Erase all data…',
    eraseWarning: (n: number) =>
      `This deletes all ${n} ${p(n, 'session', 'sessions')}, your tags, coins and unlocks. There is no undo.`,
    eraseConfirm: 'Erase everything',
    restored: (n: number) => `Restored ${n} ${p(n, 'session', 'sessions')}.`,
    errorInvalidJson: 'This file isn’t valid JSON.',
    errorNotBackup: 'This doesn’t look like a Lesisko backup.',
    restoreTitle: 'Restore backup?',
    restoreSummary: (date: string, sessions: number, tags: number) =>
      `Backup from ${date} with ${sessions} ${p(sessions, 'session', 'sessions')} and ${tags} ${p(tags, 'tag', 'tags')}.`,
    restoreWarning: (n: number) => `This replaces everything currently in the app (${n} ${p(n, 'session', 'sessions')}).`,
    restoreConfirm: 'Restore',
  },

  forestImport: {
    title: 'Import from Forest',
    found: (n: number, from: string, to: string, trees: number, withered: number, total: string) =>
      `Found ${n} ${p(n, 'session', 'sessions')} from ${from} to ${to}: ${trees} ${p(trees, 'tree', 'trees')}, ${withered} withered, ${total} of focus.`,
    tags: (list: string) => `Tags: ${list}`,
    firstSession: (range: string) =>
      `First session: ${range}. If that time looks shifted, cancel — the file’s date format may need a tweak.`,
    nothingFound: 'No sessions could be read from this file.',
    skipped: (n: number) => `${n} ${p(n, 'row', 'rows')} skipped:`,
    line: (line: number, reason: string) => `Line ${line}: ${reason}`,
    noDuplicates: 'Importing the same file again won’t create duplicates.',
    confirm: (n: number) => `Import ${n} ${p(n, 'session', 'sessions')}`,
    doneTitle: 'Import finished 🌳',
    added: (added: number, updated: number) =>
      `Added ${added} ${p(added, 'session', 'sessions')}` + (updated > 0 ? ` and updated ${updated} already imported.` : '.'),
    newTags: (list: string) => `New tags: ${list}`,
    nice: 'Nice',
    errors: {
      empty: 'The file is empty.',
      columns: (header: string) => `Couldn’t find start/end columns. Header was: ${header}`,
      date: (value: string) => `Unreadable date “${value}”`,
      order: 'End time is not after start time',
    },
  },

  species: {
    oak: { name: 'Oak', blurb: 'Steady and strong. The classic.' },
    pine: { name: 'Pine', blurb: 'Evergreen focus, all year round.' },
    birch: { name: 'Birch', blurb: 'Light, bright and slender.' },
    sunflower: { name: 'Sunflower', blurb: 'Always turns towards the light.' },
    cherry: { name: 'Cherry Blossom', blurb: 'Soft pink petals for calm sessions.' },
    cactus: { name: 'Cactus', blurb: 'Thrives even on the driest topics.' },
    maple: { name: 'Autumn Maple', blurb: 'Warm colours for cosy evenings.' },
    palm: { name: 'Palm', blurb: 'A little holiday for your brain.' },
    mushroom: { name: 'Mushroom', blurb: 'Grows quietly in the shade.' },
    lavender: { name: 'Wisteria', blurb: 'Rare and dreamy.' },
    spruce: { name: 'Snowy Spruce', blurb: 'Dusted with fresh snow.' },
    golden: { name: 'Golden Tree', blurb: 'For the truly dedicated.' },
  } satisfies Record<SpeciesId, { name: string; blurb: string }>,

  themes: {
    meadow: 'Meadow',
    autumn: 'Autumn',
    winter: 'Winter',
    sakura: 'Sakura',
    night: 'Night Forest',
  } satisfies Record<ThemeId, string>,
}

export type Messages = typeof en
