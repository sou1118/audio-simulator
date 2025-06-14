"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"

interface BinaryEncodingDisplayProps {
	processedData: Float32Array | null
	bitDepth: number
	showBinaryData: boolean
	getBinaryRepresentation: (value: number, bits: number) => string
}

export function BinaryEncodingDisplay({
	processedData,
	bitDepth,
	showBinaryData,
	getBinaryRepresentation,
}: BinaryEncodingDisplayProps) {
	const quantizationLevels = 2 ** bitDepth

	return (
		<Card>
			<CardHeader>
				<CardTitle>符号化の例</CardTitle>
			</CardHeader>
			<CardContent>
				{processedData && showBinaryData ? (
					<div className="space-y-4">
						<p className="text-sm text-gray-600">
							現在表示されている範囲の最初の10サンプル：
						</p>
						<div className="overflow-x-auto">
							<table className="min-w-full text-xs font-mono">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2">サンプル#</th>
										<th className="text-left p-2">アナログ値</th>
										<th className="text-left p-2">量子化値</th>
										<th className="text-left p-2">2進数表現</th>
									</tr>
								</thead>
								<tbody>
									{Array.from({
										length: Math.min(10, processedData.length),
									}).map((_, i) => {
										const value = processedData[i]
										if (value === undefined) return null
										const quantized =
											Math.round(value * (quantizationLevels / 2)) /
											(quantizationLevels / 2)
										const binary = getBinaryRepresentation(value, bitDepth)
										return (
											<tr
												key={`sample-${i}-${value.toFixed(4)}`}
												className="border-b hover:bg-gray-50"
											>
												<td className="p-2">{i}</td>
												<td className="p-2">{value.toFixed(4)}</td>
												<td className="p-2">{quantized.toFixed(4)}</td>
												<td className="p-2">{binary}</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
						<Alert>
							<Info className="h-4 w-4" />
							<AlertDescription className="text-xs">
								各サンプルは{bitDepth}ビットの2進数で表現されます。
								これが音声データの基本的な符号化形式です。
							</AlertDescription>
						</Alert>
					</div>
				) : (
					<p className="text-sm text-gray-500">
						バイナリデータ表示を有効にしてください。
					</p>
				)}
			</CardContent>
		</Card>
	)
}
