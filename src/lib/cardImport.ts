import type { ApiProvider } from './apiProviderContext'

export interface CardImportResult {
  cardName: string | null
  baseRate: number | null
  rewardCap: number | null
  spendCap: number | null
  validFrom: string | null
  validTo: string | null
  storeRules: {
    categoryName: string
    stores: string[]
    bonusRate: number
    spendCap: number
    capPeriod: 'monthly' | 'period'
  }[]
}

// ── Fetch page HTML via CORS proxy ─────────────────────────────────────────

export async function fetchPageHtml(url: string): Promise<string> {
  const proxyUrl = `https://cois-pioxy.sizeane0521.workers.dev?url=${encodeURIComponent(url)}`
  let response: Response
  try {
    response = await fetch(proxyUrl)
  } catch {
    throw new Error('無法連線至 CORS proxy，請確認網路連線或改用手動貼入 HTML。')
  }
  if (!response.ok) {
    throw new Error(`CORS proxy 回傳錯誤（HTTP ${response.status}），請改用手動貼入 HTML。`)
  }
  const json = await response.json()
  if (!json.contents) {
    throw new Error('CORS proxy 未回傳頁面內容，請改用手動貼入 HTML。')
  }
  return json.contents as string
}

// ── Clean HTML ─────────────────────────────────────────────────────────────

export function cleanHtml(html: string): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')

  const mainMatch = cleaned.match(/<main[\s\S]*?<\/main>/i)
  const articleMatch = cleaned.match(/<article[\s\S]*?<\/article>/i)
  const bodyMatch = cleaned.match(/<body[\s\S]*?<\/body>/i)

  const content = mainMatch?.[0] ?? articleMatch?.[0] ?? bodyMatch?.[0] ?? cleaned
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 30000)
}

// ── Parse AI response ──────────────────────────────────────────────────────

export function parseClaudeResponse(raw: string): CardImportResult | null {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : raw
    const parsed = JSON.parse(jsonStr)

    if (typeof parsed !== 'object' || parsed === null) return null

    const storeRules: CardImportResult['storeRules'] = []
    if (Array.isArray(parsed.storeRules)) {
      for (const rule of parsed.storeRules) {
        if (!rule || typeof rule !== 'object') continue
        const categoryName = typeof rule.categoryName === 'string' ? rule.categoryName : ''
        if (!categoryName) continue
        storeRules.push({
          categoryName,
          stores: Array.isArray(rule.stores)
            ? rule.stores.filter((s: unknown) => typeof s === 'string')
            : [],
          bonusRate: typeof rule.bonusRate === 'number' ? rule.bonusRate : 0,
          spendCap: typeof rule.spendCap === 'number' ? rule.spendCap : 0,
          capPeriod: rule.capPeriod === 'period' ? 'period' : 'monthly',
        })
      }
    }

    return {
      cardName: typeof parsed.cardName === 'string' ? parsed.cardName : null,
      baseRate: typeof parsed.baseRate === 'number' ? parsed.baseRate : null,
      rewardCap: typeof parsed.rewardCap === 'number' ? parsed.rewardCap : null,
      spendCap: typeof parsed.spendCap === 'number' ? parsed.spendCap : null,
      validFrom: typeof parsed.validFrom === 'string' ? parsed.validFrom : null,
      validTo: typeof parsed.validTo === 'string' ? parsed.validTo : null,
      storeRules,
    }
  } catch {
    return null
  }
}

// ── Call Claude API ────────────────────────────────────────────────────────

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch {
    throw new Error('無法連線至 Claude API，請確認網路連線。')
  }
  if (response.status === 401 || response.status === 403) throw new Error('INVALID_API_KEY')
  if (!response.ok) throw new Error(`Claude API 回傳錯誤（HTTP ${response.status}）。`)
  const data = await response.json()
  return data?.content?.[0]?.text ?? ''
}

// ── Call Gemini API ────────────────────────────────────────────────────────

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
  } catch {
    throw new Error('無法連線至 Gemini API，請確認網路連線。')
  }
  if (response.status === 400) throw new Error('INVALID_API_KEY')
  if (response.status === 403) throw new Error('INVALID_API_KEY')
  if (!response.ok) throw new Error(`Gemini API 回傳錯誤（HTTP ${response.status}）。`)
  const data = await response.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Parse card from HTML (provider-aware) ─────────────────────────────────

export async function parseCardFromHtml(
  html: string,
  apiKey: string,
  provider: ApiProvider
): Promise<CardImportResult> {
  if (!apiKey || !apiKey.trim()) throw new Error('NO_API_KEY')

  const prompt = `你是信用卡回饋資訊擷取助手。請從以下網頁文字內容中，擷取信用卡的回饋資訊，並以 JSON 格式回傳。

請嚴格回傳以下 JSON 格式，找不到的欄位填 null 或空陣列，不要加任何額外說明：

{
  "cardName": "信用卡名稱（字串）或 null",
  "baseRate": 海外一般消費回饋率（數字，例如 3.0 代表 3%）或 null,
  "rewardCap": 每月回饋金上限（整數，新台幣）或 null,
  "spendCap": 每月加碼消費上限（整數，新台幣）或 null,
  "validFrom": "活動開始日期（YYYY-MM-DD 格式）或 null",
  "validTo": "活動結束日期（YYYY-MM-DD 格式）或 null",
  "storeRules": [
    {
      "categoryName": "銀行定義的加碼通路名稱（例如：熱門商店、行動支付加碼）",
      "stores": ["實際店家名稱1", "實際店家名稱2"],
      "bonusRate": 加碼回饋率（數字，例如 3.0 代表 3%）,
      "spendCap": 此通路的消費上限（整數，新台幣，找不到填 0）,
      "capPeriod": "monthly 或 period（monthly=每月重置；period=整個活動期間只算一次）"
    }
  ]
}

注意事項：
- validFrom / validTo：民國年需轉換為西元年（例如 115/1/1 → 2026-01-01）
- stores：請列出頁面上該通路下明確列舉的所有實際店家名稱，例如 7-ELEVEN、FamilyMart、唐吉訶德、東京迪士尼等；若無列舉具體店家則填空陣列 []
- capPeriod：頁面寫「每月上限」填 "monthly"；寫「活動期間上限」填 "period"；不確定填 "monthly"
- 一個通路若同時有多個 bonusRate（例如登錄加碼1.5%、帳單滿額加碼1%），請拆成兩個獨立的 storeRules 項目

範例：
{
  "cardName": "吉鶴卡",
  "baseRate": 2.5,
  "rewardCap": null,
  "spendCap": null,
  "validFrom": "2026-01-01",
  "validTo": "2026-06-30",
  "storeRules": [
    {
      "categoryName": "熱門商店加碼",
      "stores": ["7-ELEVEN", "FamilyMart", "LAWSON", "唐吉訶德", "東京迪士尼", "大阪環球影城"],
      "bonusRate": 3.0,
      "spendCap": 600,
      "capPeriod": "period"
    },
    {
      "categoryName": "行動支付登錄加碼",
      "stores": [],
      "bonusRate": 1.5,
      "spendCap": 600,
      "capPeriod": "monthly"
    }
  ]
}

網頁內容：
${html}`

  const rawText = provider === 'gemini'
    ? await callGemini(prompt, apiKey)
    : await callClaude(prompt, apiKey)

  const result = parseClaudeResponse(rawText)
  if (!result) throw new Error('AI 回傳的內容無法解析，請重試或改用手動填寫。')
  return result
}

// ── Public entry points ────────────────────────────────────────────────────

export async function importCardFromUrl(
  url: string,
  apiKey: string,
  provider: ApiProvider
): Promise<CardImportResult> {
  if (!apiKey) throw new Error('NO_API_KEY')
  const rawHtml = await fetchPageHtml(url)
  const cleaned = cleanHtml(rawHtml)
  return parseCardFromHtml(cleaned, apiKey, provider)
}

export async function importCardFromHtml(
  html: string,
  apiKey: string,
  provider: ApiProvider
): Promise<CardImportResult> {
  if (!apiKey) throw new Error('NO_API_KEY')
  const cleaned = cleanHtml(html)
  return parseCardFromHtml(cleaned, apiKey, provider)
}
