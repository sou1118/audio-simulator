"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Play, Square, Volume2 } from "lucide-react"

interface AudioPlaybackControlsProps {
	originalBuffer: AudioBuffer | null
	processedBuffer: AudioBuffer | null
	isPlaying: { original: boolean; processed: boolean }
	volume: number
	onPlayOriginal: () => void
	onPlayProcessed: () => void
	onStop: () => void
	onVolumeChange: (volume: number) => void
}

export function AudioPlaybackControls({
	originalBuffer,
	processedBuffer,
	isPlaying,
	volume,
	onPlayOriginal,
	onPlayProcessed,
	onStop,
	onVolumeChange,
}: AudioPlaybackControlsProps) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					<div className="flex items-center justify-center gap-4 px-4">
						<Volume2 className="h-5 w-5 text-gray-600" />
						<div className="flex-1 max-w-xs">
							<Slider
								value={[volume * 100]}
								onValueChange={(value) => onVolumeChange(value[0] / 100)}
								min={0}
								max={100}
								step={1}
								className="w-full"
							/>
						</div>
						<Badge variant="outline" className="min-w-[60px] text-center">
							{Math.round(volume * 100)}%
						</Badge>
					</div>

					<Separator />

					<div className="flex flex-wrap justify-center gap-3">
						<Button
							onClick={onPlayOriginal}
							disabled={!originalBuffer}
							className="flex items-center gap-2"
							variant={isPlaying.original ? "default" : "outline"}
						>
							<Play className="h-4 w-4" />
							{isPlaying.original ? "再生中..." : "元の音を再生"}
						</Button>
						<Button
							onClick={onPlayProcessed}
							disabled={!processedBuffer}
							variant={isPlaying.processed ? "secondary" : "outline"}
							className="flex items-center gap-2"
						>
							<Play className="h-4 w-4" />
							{isPlaying.processed ? "再生中..." : "処理後の音を再生"}
						</Button>
						<Button
							onClick={onStop}
							variant="destructive"
							className="flex items-center gap-2"
							disabled={!isPlaying.original && !isPlaying.processed}
						>
							<Square className="h-4 w-4" />
							停止
						</Button>
					</div>
					{(isPlaying.original || isPlaying.processed) && (
						<div className="text-center mt-3">
							<Badge variant="outline" className="animate-pulse">
								{isPlaying.original ? "元の音" : "処理後の音"}を再生中
							</Badge>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
