"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Info } from "lucide-react"

interface VisualizationSettingsProps {
	showSamplingPoints: boolean
	showQuantizationLevels: boolean
	showBinaryData: boolean
	onShowSamplingPointsChange: (checked: boolean) => void
	onShowQuantizationLevelsChange: (checked: boolean) => void
	onShowBinaryDataChange: (checked: boolean) => void
}

export function VisualizationSettings({
	showSamplingPoints,
	showQuantizationLevels,
	showBinaryData,
	onShowSamplingPointsChange,
	onShowQuantizationLevelsChange,
	onShowBinaryDataChange,
}: VisualizationSettingsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>可視化設定</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label
							htmlFor="sampling-points"
							className="text-sm font-medium cursor-pointer"
						>
							サンプリングポイントを表示
						</Label>
						<Switch
							id="sampling-points"
							checked={showSamplingPoints}
							onCheckedChange={onShowSamplingPointsChange}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label
							htmlFor="quantization-levels"
							className="text-sm font-medium cursor-pointer"
						>
							量子化レベルを表示
						</Label>
						<Switch
							id="quantization-levels"
							checked={showQuantizationLevels}
							onCheckedChange={onShowQuantizationLevelsChange}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label
							htmlFor="binary-data"
							className="text-sm font-medium cursor-pointer"
						>
							バイナリデータを表示
						</Label>
						<Switch
							id="binary-data"
							checked={showBinaryData}
							onCheckedChange={onShowBinaryDataChange}
						/>
					</div>
				</div>
				{showSamplingPoints && (
					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription className="text-xs">
							処理後の波形上の白い点をクリックすると、そのサンプルの詳細情報が表示されます。
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	)
}
