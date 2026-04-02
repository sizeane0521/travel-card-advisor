import type { ApiProvider } from './apiProviderContext'

export interface CardImportResult {
  cardName: string | null
  baseRate: number | null
  capType: 'reward' | 'spend' | null
  capValue: number | null
  storeRules: { storeName: string; bonusRate: number; spendCap: number }[]
}

// ── Fetch page HTML via CORS proxy ─────────────────────────────────────────

export async function fetchPageHtml(url: string): Promise<string> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
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

// ── Parse Claude/Gemini response ───────────────────────────────────────────

export function parseClaudeResponse(raw: string): CardImportResult | null {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : raw
    const parsed = JSON.parse(jsonStr)

    if (typeof parsed !== 'object' || parsed === null) return null

    const storeRules: CardImportResult['storeRules'] = []
    if (Array.isArray(parsed.storeRules)) {
      for (const rule of parsed.storeRules) {
        if (rule && typeof rule.storeName === 'string' && rule.storeName) {
          storeRules.push({
            storeName: rule.storeName,
            bonusRate: typeof rule.bonusRate === 'number' ? rule.bonusRate : 0,
            spendCap: typeof rule.spendCap === 'number' ? rule.spendCap : 0,
          })
        }
      }
    }

    return {
      cardName: typeof parsed.cardName === 'string' ? parsed.cardName : null,
      baseRate: typeof parsed.baseRate === 'number' ? parsed.baseRate : null,
      capType: parsed.capType === 'reward' || parsed.capType === 'spend' ? parsed.capType : null,
      capValue: typeof parsed.capValue === 'number' ? parsed.capValue : null,
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
        max_tokens: 1024,
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
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

請嚴格回傳以下 JSON 格式，找不到的欄位填 null，不要加任何額外說明：

{
  "cardName": "信用卡名稱（字串）或 null",
  "baseRate": 海外一般消費回饋率（數字，例如 3.0 代表 3%）或 null,
  "capType": "reward"（回饋金上限）或 "spend"（消費金額上限）或 null,
  "capValue": 每月上限金額（整數，新台幣）或 null,
  "storeRules": [
    {
      "storeName": "店家或品牌名稱",
      "bonusRate": 加碼回饋率（數字，例如 5.0 代表 5%）,
      "spendCap": 該店家每月消費上限（整數，新台幣，找不到填 0）
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
