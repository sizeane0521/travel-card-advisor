import type { ApiProvider } from './apiProviderContext'

type BonusRule = {
  categoryName: string
  stores: string[]
  bonusRate: number
  spendCap: number
  capPeriod: 'monthly' | 'period'
  subCategories?: { label: string; stores: string[] }[]
}

export interface CardImportResult {
  cardName: string | null
  baseRate: number | null
  rewardCap: number | null
  spendCap: number | null
  validFrom: string | null
  validTo: string | null
  storeRules: (BonusRule & { prerequisite?: string })[]
  newUserBonusRules?: BonusRule[]
  paymentMethodBonusTiers?: {
    rate: number
    monthlyCap: number
    prerequisite?: string
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
        const subCategories: { label: string; stores: string[] }[] | undefined =
          Array.isArray(rule.subCategories)
            ? rule.subCategories
                .filter((sc: unknown) => sc && typeof sc === 'object')
                .map((sc: { label?: unknown; stores?: unknown }) => ({
                  label: typeof sc.label === 'string' ? sc.label : '',
                  stores: Array.isArray(sc.stores)
                    ? sc.stores.filter((s: unknown) => typeof s === 'string')
                    : [],
                }))
                .filter((sc: { label: string; stores: string[] }) => sc.label)
            : undefined
        storeRules.push({
          categoryName,
          stores: Array.isArray(rule.stores)
            ? rule.stores.filter((s: unknown) => typeof s === 'string')
            : [],
          bonusRate: typeof rule.bonusRate === 'number' ? rule.bonusRate : 0,
          spendCap: typeof rule.spendCap === 'number' ? rule.spendCap : 0,
          capPeriod: rule.capPeriod === 'period' ? 'period' : 'monthly',
          ...(subCategories ? { subCategories } : {}),
          ...(typeof rule.prerequisite === 'string' ? { prerequisite: rule.prerequisite } : {}),
        })
      }
    }

    const paymentMethodBonusTiers: CardImportResult['paymentMethodBonusTiers'] = []
    if (Array.isArray(parsed.paymentMethodBonusTiers)) {
      for (const tier of parsed.paymentMethodBonusTiers) {
        if (!tier || typeof tier !== 'object') continue
        if (typeof tier.rate !== 'number' || typeof tier.monthlyCap !== 'number') continue
        paymentMethodBonusTiers.push({
          rate: tier.rate,
          monthlyCap: tier.monthlyCap,
          prerequisite: typeof tier.prerequisite === 'string' ? tier.prerequisite : undefined,
        })
      }
    }

    const newUserBonusRules: CardImportResult['newUserBonusRules'] = []
    if (Array.isArray(parsed.newUserBonusRules)) {
      for (const rule of parsed.newUserBonusRules) {
        if (!rule || typeof rule !== 'object') continue
        const categoryName = typeof rule.categoryName === 'string' ? rule.categoryName : ''
        if (!categoryName) continue
        const subCategories: { label: string; stores: string[] }[] | undefined =
          Array.isArray(rule.subCategories)
            ? rule.subCategories
                .filter((sc: unknown) => sc && typeof sc === 'object')
                .map((sc: { label?: unknown; stores?: unknown }) => ({
                  label: typeof sc.label === 'string' ? sc.label : '',
                  stores: Array.isArray(sc.stores)
                    ? sc.stores.filter((s: unknown) => typeof s === 'string')
                    : [],
                }))
                .filter((sc: { label: string; stores: string[] }) => sc.label)
            : undefined
        newUserBonusRules.push({
          categoryName,
          stores: Array.isArray(rule.stores)
            ? rule.stores.filter((s: unknown) => typeof s === 'string')
            : [],
          bonusRate: typeof rule.bonusRate === 'number' ? rule.bonusRate : 0,
          spendCap: typeof rule.spendCap === 'number' ? rule.spendCap : 0,
          capPeriod: rule.capPeriod === 'period' ? 'period' : 'monthly',
          ...(subCategories ? { subCategories } : {}),
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
      newUserBonusRules: newUserBonusRules.length > 0 ? newUserBonusRules : undefined,
      paymentMethodBonusTiers,
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

// ── Shared extraction prompt ───────────────────────────────────────────────

function buildExtractionPrompt(content: string): string {
  return `你是信用卡回饋資訊擷取助手。請從以下內容中，擷取信用卡的回饋資訊，並以 JSON 格式回傳。

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
      "categoryName": "銀行定義的加碼通路名稱（例如：熱門商店加碼、超市加碼）",
      "stores": ["實際店家名稱1", "實際店家名稱2"],
      "bonusRate": 加碼回饋率（數字，例如 3.0 代表 3%）,
      "spendCap": 此通路的消費上限（整數，新台幣，找不到填 0）,
      "capPeriod": "monthly 或 period（monthly=每月重置；period=整個活動期間只算一次）",
      "subCategories": [
        { "label": "子分組標題（例如：便利商店、樂園、百貨）", "stores": ["屬於此子分組的店家名稱"] }
      ],
      "prerequisite": "加碼前提條件（例如：需登錄）或 null（注意：新戶限定條件請放入 newUserBonusRules，不在此填寫）"
    }
  ],
  "newUserBonusRules": [
    {
      "categoryName": "新戶限定加碼名稱（例如：新戶實體消費加碼）",
      "stores": ["實際店家名稱1"],
      "bonusRate": 加碼回饋率（數字）,
      "spendCap": 消費上限（整數，新台幣，找不到填 0）,
      "capPeriod": "monthly 或 period",
      "subCategories": []
    }
  ],
  "paymentMethodBonusTiers": [
    {
      "rate": 行動支付加碼回饋率（數字，例如 1.5 代表 1.5%）,
      "monthlyCap": 此 tier 的每月回饋金上限（整數，新台幣），
      "prerequisite": "加碼條件說明（例如：前月帳單滿30000元）或 null"
    }
  ]
}

注意事項：
- validFrom / validTo：民國年需轉換為西元年（例如 115/1/1 → 2026-01-01）
- stores：請列出頁面上該通路下明確列舉的所有實際店家名稱；若無列舉具體店家則填空陣列 []
- capPeriod：頁面寫「每月上限」填 "monthly"；寫「活動期間上限」填 "period"；不確定填 "monthly"
- subCategories：若頁面在同一加碼條件下，有視覺上明確的子分組標題，請以 subCategories 陣列回傳；若無明顯視覺子分組則省略 subCategories 欄位（不要輸出空陣列）
- 一個通路若同時有多個 bonusRate，請拆成兩個獨立項目
- 【重要】新戶加碼分離：若某通路的前提條件為「限新戶」、「限首次」、「限初次」、「新戶」等新戶限定條件，請將該通路放入 newUserBonusRules，不放入 storeRules，且 newUserBonusRules 的項目不需要 prerequisite 欄位（類型本身即代表限新戶）
- 【重要】行動支付加碼（Apple Pay、Google Pay、感應支付等）一律放入 paymentMethodBonusTiers，不得放入 storeRules
- storeRules 中的 prerequisite：僅填「非新戶」的前提條件（如「需登錄」）；若無條件填 null

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
      "capPeriod": "period",
      "subCategories": [
        { "label": "便利商店", "stores": ["7-ELEVEN", "FamilyMart", "LAWSON"] },
        { "label": "熱門景點", "stores": ["東京迪士尼", "大阪環球影城"] }
      ],
      "prerequisite": null
    }
  ],
  "newUserBonusRules": [
    {
      "categoryName": "新戶實體消費加碼",
      "stores": [],
      "bonusRate": 3.0,
      "spendCap": 20000,
      "capPeriod": "period"
    }
  ],
  "paymentMethodBonusTiers": [
    {
      "rate": 1.5,
      "monthlyCap": 600,
      "prerequisite": null
    }
  ]
}

內容：
${content}`
}

// ── Call Claude API with image ─────────────────────────────────────────────

async function callClaudeWithImage(base64: string, mimeType: string, apiKey: string): Promise<string> {
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
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: buildExtractionPrompt('（請從上方截圖中擷取資訊）') },
          ],
        }],
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

// ── Call Gemini API with image ─────────────────────────────────────────────

async function callGeminiWithImage(base64: string, mimeType: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: buildExtractionPrompt('（請從上方截圖中擷取資訊）') },
          ],
        }],
      }),
    })
  } catch {
    throw new Error('無法連線至 Gemini API，請確認網路連線。')
  }
  if (response.status === 400 || response.status === 403) throw new Error('INVALID_API_KEY')
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

  const prompt = buildExtractionPrompt(html)

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

export async function importCardFromImage(
  base64: string,
  mimeType: string,
  apiKey: string,
  provider: ApiProvider
): Promise<CardImportResult> {
  if (!apiKey || !apiKey.trim()) throw new Error('NO_API_KEY')
  const rawText = provider === 'gemini'
    ? await callGeminiWithImage(base64, mimeType, apiKey)
    : await callClaudeWithImage(base64, mimeType, apiKey)
  const result = parseClaudeResponse(rawText)
  if (!result) throw new Error('AI 回傳的內容無法解析，請重試或改用手動填寫。')
  return result
}
