"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn } from "lucide-react"

interface WaveformViewControlsProps {
	xZoom: number
	xOffset: number
	yZoom: number
	yOffset: number
	onXZoomChange: (value: number) => void
	onXOffsetChange: (value: number) => void
	onYZoomChange: (value: number) => void
	onYOffsetChange: (value: number) => void
	onResetAll: () => void
	onSamplingObservationZoom: () => void
}

export function WaveformViewControls({
	xZoom,
	xOffset,
	yZoom,
	yOffset,
	onXZoomChange,
	onXOffsetChange,
	onYZoomChange,
	onYOffsetChange,
	onResetAll,
	onSamplingObservationZoom,
}: WaveformViewControlsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ZoomIn className="h-5 w-5" />
					波形表示コントロール
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-6">
					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
							📈 X軸（時間軸）コントロール
						</h4>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-3">
								<Label className="text-sm font-medium">
									時間軸拡大率:
									<Badge variant="secondary" className="ml-2">
										{xZoom}x
									</Badge>
								</Label>
								<Slider
									value={[Math.max(1, Math.min(50, xZoom))]}
									onValueChange={(value) =>
										onXZoomChange(Math.max(1, Math.min(50, value[0])))
									}
									min={1}
									max={50}
									step={0.5}
									className="w-full"
								/>
							</div>
							<div className="space-y-3">
								<Label className="text-sm font-medium">
									時間軸表示位置:
									<Badge variant="secondary" className="ml-2">
										{Math.round(xOffset)}%
									</Badge>
								</Label>
								<Slider
									value={[
										Math.max(
											0,
											Math.min(
												Math.max(0, 100 - 100 / Math.max(1, xZoom)),
												xOffset,
											),
										),
									]}
									onValueChange={(value) =>
										onXOffsetChange(
											Math.max(
												0,
												Math.min(
													Math.max(0, 100 - 100 / Math.max(1, xZoom)),
													value[0],
												),
											),
										)
									}
									min={0}
									max={Math.max(0, 100 - 100 / Math.max(1, xZoom))}
									step={1}
									className="w-full"
								/>
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
							📊 Y軸（振幅軸）コントロール
						</h4>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-3">
								<Label className="text-sm font-medium">
									振幅拡大率:
									<Badge variant="secondary" className="ml-2">
										{Math.max(0.1, Math.min(10, yZoom)).toFixed(1)}x
									</Badge>
								</Label>
								<Slider
									value={[Math.max(0.1, Math.min(10, yZoom))]}
									onValueChange={(value) =>
										onYZoomChange(Math.max(0.1, Math.min(10, value[0])))
									}
									min={0.1}
									max={10}
									step={0.1}
									className="w-full"
								/>
							</div>
							<div className="space-y-3">
								<Label className="text-sm font-medium">
									振幅オフセット:
									<Badge variant="secondary" className="ml-2">
										{Math.round(Math.max(-100, Math.min(100, yOffset)))}%
									</Badge>
								</Label>
								<Slider
									value={[Math.max(-100, Math.min(100, yOffset))]}
									onValueChange={(value) =>
										onYOffsetChange(Math.max(-100, Math.min(100, value[0])))
									}
									min={-100}
									max={100}
									step={1}
									className="w-full"
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={onResetAll}
						className="flex items-center gap-2"
					>
						<RotateCcw className="h-4 w-4" />
						すべてリセット
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={onSamplingObservationZoom}
					>
						サンプリング観察用拡大
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
