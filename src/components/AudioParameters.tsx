"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RotateCcw } from "lucide-react"

interface AudioParametersProps {
	sampleRate: number
	bitDepth: number
	quantizationLevels: number
	onSampleRateChange: (value: number) => void
	onBitDepthChange: (value: number) => void
	onReset: () => void
}

export function AudioParameters({
	sampleRate,
	bitDepth,
	quantizationLevels,
	onSampleRateChange,
	onBitDepthChange,
	onReset,
}: AudioParametersProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>デジタル化パラメータ</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid md:grid-cols-2 gap-6">
					<div className="space-y-3">
						<Label className="text-sm font-medium">
							標本化周波数（サンプリングレート）:
							<Badge variant="secondary" className="ml-2">
								{sampleRate.toLocaleString()} Hz
							</Badge>
						</Label>
						<Slider
							value={[sampleRate]}
							onValueChange={(value) => onSampleRateChange(value[0])}
							min={1000}
							max={48000}
							step={100}
							className="w-full"
						/>
						<p className="text-xs text-gray-600">
							1秒間に{sampleRate.toLocaleString()}回の測定
						</p>
					</div>
					<div className="space-y-3">
						<Label className="text-sm font-medium">
							量子化ビット数:
							<Badge variant="secondary" className="ml-2">
								{bitDepth} bit
							</Badge>
						</Label>
						<Slider
							value={[bitDepth]}
							onValueChange={(value) => onBitDepthChange(value[0])}
							min={1}
							max={16}
							step={1}
							className="w-full"
						/>
						<p className="text-xs text-gray-600">
							{quantizationLevels.toLocaleString()}段階で表現
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={onReset}
					className="flex items-center gap-2"
				>
					<RotateCcw className="h-4 w-4" />
					パラメータを初期値に戻す
				</Button>
			</CardContent>
		</Card>
	)
}
