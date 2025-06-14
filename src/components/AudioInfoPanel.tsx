"use client"

import { Card, CardContent } from "@/components/ui/card"

interface AudioInfoPanelProps {
	sampleRate: number
	bitDepth: number
	quantizationLevels: number
	bitRate: number
}

export function AudioInfoPanel({
	sampleRate,
	bitDepth,
	quantizationLevels,
	bitRate,
}: AudioInfoPanelProps) {
	return (
		<Card className="bg-blue-50 border-blue-200">
			<CardContent className="pt-6">
				<div className="grid md:grid-cols-4 gap-4 text-sm">
					<div className="space-y-1">
						<p className="font-medium text-blue-900">📊 標本化周波数</p>
						<p className="text-blue-700">{sampleRate.toLocaleString()} Hz</p>
						<p className="text-xs text-blue-600">
							1秒間に {sampleRate.toLocaleString()} 回サンプリング
						</p>
					</div>
					<div className="space-y-1">
						<p className="font-medium text-blue-900">📏 量子化レベル</p>
						<p className="text-blue-700">{bitDepth} bit</p>
						<p className="text-xs text-blue-600">
							{quantizationLevels.toLocaleString()} 段階
						</p>
					</div>
					<div className="space-y-1">
						<p className="font-medium text-blue-900">💾 データレート</p>
						<p className="text-blue-700">{bitRate.toFixed(1)} kbps</p>
						<p className="text-xs text-blue-600">ステレオ</p>
					</div>
					<div className="space-y-1">
						<p className="font-medium text-blue-900">🔢 符号化</p>
						<p className="text-blue-700">{bitDepth}ビット符号</p>
						<p className="text-xs text-blue-600">
							各サンプル{bitDepth}桁の2進数
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
