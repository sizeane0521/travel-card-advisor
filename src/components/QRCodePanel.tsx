import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import type { Card } from '../types'

interface Props {
  cards: Card[]
  onBack: () => void
}

export default function QRCodePanel({ cards, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(cards))))
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
    }).catch(console.error)
  }, [cards])

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-500 text-sm">← 返回</button>
        <h1 className="text-lg font-semibold text-gray-900">產生 QR Code</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
        <canvas ref={canvasRef} className="rounded-lg" />
        <p className="text-sm text-gray-500 mt-4 text-center">
          用手機 Safari 掃描此 QR Code，即可匯入 {cards.length} 張卡片設定。
        </p>
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700">
          <strong>使用步驟：</strong><br />
          1. 在手機 Safari 中開啟本網站<br />
          2. 前往「設定」→「掃碼匯入」<br />
          3. 掃描此 QR Code<br />
          4. 將網頁加入主畫面（分享 → 加入主畫面）<br />
          5. 之後直接從主畫面開啟 App 即可使用
        </p>
      </div>
    </div>
  )
}
