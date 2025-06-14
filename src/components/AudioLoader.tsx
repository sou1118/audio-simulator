"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload, Volume2 } from "lucide-react"
import type React from "react"

interface AudioLoaderProps {
	onLoadPreset: (type: "sine" | "voice" | "music") => void
	onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
	fileInputRef: React.RefObject<HTMLInputElement | null> // nullを許可する
}

export function AudioLoader({
	onLoadPreset,
	onFileUpload,
	fileInputRef,
}: AudioLoaderProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Upload className="h-5 w-5" />
					音声ファイルの選択
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={() => onLoadPreset("sine")}
						className="flex items-center gap-2"
					>
						<Volume2 className="h-4 w-4" />
						正弦波（440Hz）
					</Button>
					<Button
						variant="outline"
						onClick={() => onLoadPreset("voice")}
						className="flex items-center gap-2"
					>
						<Volume2 className="h-4 w-4" />
						音声サンプル
					</Button>
					<Button
						variant="outline"
						onClick={() => onLoadPreset("music")}
						className="flex items-center gap-2"
					>
						<Volume2 className="h-4 w-4" />
						音楽サンプル
					</Button>
				</div>
				<Separator />
				<div className="space-y-2">
					<Label htmlFor="file-upload">
						または、音声ファイルをアップロード:
					</Label>
					<Input
						id="file-upload"
						type="file"
						accept="audio/*"
						onChange={onFileUpload}
						ref={fileInputRef}
					/>
				</div>
			</CardContent>
		</Card>
	)
}
