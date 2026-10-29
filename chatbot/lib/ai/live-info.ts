export const LIVE_INFO_NOTICE =
  "I can't access live data while Web search is off, so I won't guess. Turn on Web search with the globe button, then ask again for an up-to-date answer.";

export const webSearchOffPrompt = `
Web search is OFF for this turn. You cannot see the live web, news, prices, weather, or who holds an office today.
If the question depends on information that can change — current officeholders, news, prices, weather, sports results, or anything about today, latest, or recent events — do NOT guess, estimate, or invent names, numbers, dates, or scores. Do not call search or weather tools for it.
Reply with only this message:
${LIVE_INFO_NOTICE}
Answer general knowledge, history, explanations, math, coding, and writing normally.`;

const HISTORICAL_YEAR = /\b(?:1\d{3}|20[0-1]\d|202[0-3])\b/;

const RECENCY_WORD =
  /\b(?:latest|today|tonight|yesterday|right now|as of now|this week|this weekend|this month|recent(?:ly)?|breaking|up to date|just announced|just happened)\b/;

const OFFICE =
  /\b(?:prime ministers?|presidents?|chancellors?|premiers?|governors?|mayors?|popes?|monarchs?|kings?|queens?|ceos?|chief executives?|heads? of state|heads? of government)\b/;

const ASKING =
  /\b(?:who(?:'s| is| are)?|what(?:'s| is| are)?|when|where|which|tell me|update)\b/;

function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isClearlyHistorical(question: string): boolean {
  if (/\bwho (?:was|were)\b/.test(question)) {
    return true;
  }
  if (
    /\b(?:history of|in history|historically|used to be|formerly)\b/.test(
      question
    ) &&
    !RECENCY_WORD.test(question)
  ) {
    return true;
  }
  return (
    HISTORICAL_YEAR.test(question) &&
    !RECENCY_WORD.test(question) &&
    !/\bcurrent\b/.test(question)
  );
}

function isGeneralDefinition(question: string): boolean {
  if (RECENCY_WORD.test(question) || /\bcurrent\b/.test(question)) {
    return false;
  }
  if (/^(?:define|what does .+ mean)\b/.test(question)) {
    return true;
  }
  if (/^what (?:is|are) (?:a|an)\b/.test(question)) {
    return true;
  }
  return /^(?:explain|describe) (?:how|why|what|a|an|the difference)\b/.test(
    question
  );
}

function isCreativeOrCodeTask(question: string): boolean {
  if (
    /\b(?:weather|forecast|news|headline|price of|stock price|prime minister|president|who is|current)\b/.test(
      question
    ) &&
    /\b(?:today|latest|current|now|news|weather|price)\b/.test(question)
  ) {
    return false;
  }
  return /^(?:write|compose|draft|translate|rewrite|edit|debug|refactor|fix|implement|code)\b/.test(
    question
  );
}

function asksCurrentOfficeholder(question: string): boolean {
  if (/\bwho (?:was|were)\b/.test(question)) {
    return false;
  }
  if (
    /\bwho is the current\b/.test(question) &&
    !/\b(?:user|directory|branch|version|working directory)\b/.test(question)
  ) {
    return true;
  }
  if (/\b(?:who is|who's|current) (?:the )?(?:pm|potus)\b/.test(question)) {
    return true;
  }
  if (!OFFICE.test(question)) {
    return false;
  }
  return /\b(?:who is|who's|who are|current|incumbent|in office|in power)\b/.test(
    question
  );
}

function asksNews(question: string): boolean {
  if (
    /\b(?:good news|bad news)\b/.test(question) &&
    !RECENCY_WORD.test(question)
  ) {
    return false;
  }
  if (/\b(?:headlines?|breaking news)\b/.test(question)) {
    return true;
  }
  if (
    /\bnews\b/.test(question) &&
    /\b(?:latest|today|current|recent|about|on|regarding)\b/.test(question)
  ) {
    return true;
  }
  return /\b(?:what's|what is) the news\b/.test(question);
}

function asksPrice(question: string): boolean {
  if (
    /\b(?:stock|share) prices?\b/.test(question) ||
    /\bprice of\b/.test(question) ||
    /\bexchange rates?\b/.test(question) ||
    /\b(?:market price|trading at|market cap)\b/.test(question)
  ) {
    return true;
  }
  if (
    /\b(?:bitcoin|btc|ethereum|eth|crypto|dogecoin)\b/.test(question) &&
    /\b(?:price|worth|cost|trading|value)\b/.test(question)
  ) {
    return true;
  }
  return (
    /\bhow much (?:is|are|does)\b/.test(question) &&
    /\b(?:cost|worth|price|stock|share|bitcoin)\b/.test(question)
  );
}

function asksWeather(question: string): boolean {
  if (/\bunder the weather\b/.test(question)) {
    return false;
  }
  return (
    /\b(?:weather|forecast)\b/.test(question) ||
    /\btemperature (?:in|at|for|outside)\b/.test(question)
  );
}

function asksSports(question: string): boolean {
  if (
    /\b(?:standings|league table|full time score|final score)\b/.test(question)
  ) {
    return true;
  }
  if (/\bwho(?:'s| is) winning\b/.test(question)) {
    return true;
  }
  if (
    /\b(?:the score|score of|what's the score|what is the score)\b/.test(
      question
    )
  ) {
    return true;
  }
  if (
    /\b(?:score|scores)\b/.test(question) &&
    /\b(?:game|match|football|soccer|basketball|cricket|rugby|tennis|nba|nfl|nhl|mlb|premier league|world cup|final|series)\b/.test(
      question
    )
  ) {
    return true;
  }
  if (/\bwho won\b/.test(question) && !HISTORICAL_YEAR.test(question)) {
    return true;
  }
  return (
    /\b(?:nba|nfl|nhl|mlb|premier league|champions league|world cup)\b/.test(
      question
    ) &&
    /\b(?:score|result|winner|won|standings|playing|fixture|today|tonight|latest)\b/.test(
      question
    )
  );
}

function asksRecentEvent(question: string): boolean {
  if (/\brecent events?\b/.test(question)) {
    return true;
  }
  if (/\bwhat happened\b/.test(question) && RECENCY_WORD.test(question)) {
    return true;
  }
  if (/\b(?:what(?:'s| is)|tell me) the latest\b/.test(question)) {
    return true;
  }
  return (
    RECENCY_WORD.test(question) &&
    ASKING.test(question) &&
    /\b(?:happened|happening|winner|elected|appointed|result|update|news|score|price|weather)\b/.test(
      question
    )
  );
}

export function needsLiveInfo(text: string): boolean {
  const question = normalizeQuestion(text);
  if (!question) {
    return false;
  }
  if (isClearlyHistorical(question) || isGeneralDefinition(question)) {
    return false;
  }
  if (isCreativeOrCodeTask(question)) {
    return false;
  }
  if (
    /\b(?:electric|electrical|alternating|direct|ocean|rip) current\b/.test(
      question
    ) &&
    !OFFICE.test(question) &&
    !asksWeather(question) &&
    !asksNews(question)
  ) {
    return false;
  }
  if (
    /\b(?:current directory|current working|current user|current branch)\b/.test(
      question
    ) &&
    !OFFICE.test(question)
  ) {
    return false;
  }

  return (
    asksCurrentOfficeholder(question) ||
    asksNews(question) ||
    asksPrice(question) ||
    asksWeather(question) ||
    asksSports(question) ||
    asksRecentEvent(question)
  );
}
