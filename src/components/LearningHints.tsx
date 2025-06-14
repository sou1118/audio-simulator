"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LearningHints() {
	return (
		<Card className="bg-yellow-50 border-yellow-200">
			<CardHeader>
				<CardTitle className="text-yellow-900">💡 学習のヒント</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm text-yellow-800">
				<p>
					•
					サンプリングレートを下げると、音の細かい変化が失われます（エイリアシング）
				</p>
				<p>• ビット数を下げると、音の滑らかさが失われます（量子化ノイズ）</p>
				<p>
					•
					「サンプリング観察用拡大」ボタンで、個々のサンプリングポイントを確認できます
				</p>
				<p>• CD音質は44,100Hz・16bitが標準です</p>
			</CardContent>
		</Card>
	)
}
