import { ReactNode } from 'react';

interface ArcadeFrameProps {
	children: ReactNode;
	title?: string;
}

export function ArcadeFrame({ children, title = "PONG" }: ArcadeFrameProps) {
	return (
		
		<div className="flex items-center justify-center w-full p-4 overflow-auto"
				style={{ minHeight: 'calc(100vh - 5rem)' }}>
			{/* Adjust subtracted rem value if does not fit on the screen without scrolling*/}
			{/* Arcade Cabinet - uses clamp for responsive sizing */}
			<div 
				className="relative w-full"
				style={{ 
					maxWidth: 'min(1400px, 95vw)',
					// Scale based on viewport height
					fontSize: 'clamp(0.6rem, 1.5vh, 1rem)'
				}}
			>
				{/* Top title */}
				<div
					className="relative mx-auto mb-4 p-2 border-4 border-[#FFFCC7] bg-[#6C0E42]"
					style={{
						width: '85%',
						borderRadius: '60px 60px 60px 60px',
						boxShadow: '4px 6px 0 rgba(89,50,43, 0.9)',
					}}
				>
					<div className="text-center">
						<div
							className="font-cupcake text-[#FFFCC7] tracking-wider break-words"
							style={{ 
								fontSize: 'clamp(1.2rem, min(6vw, 5dvh), 3rem)',
								textShadow: `
									-3px 0 #000,
									3px 0 #000,
									0 3px #000,
									0 -3px #000,
									3px 3px #59322B,
									-3px -3px #59322B`
							}}>
							{title}
						</div>
					</div>
				</div>

				{/* Main screen*/}
				<div
					className="relative p-8 border-8 border-[#FFFCC7] bg-[#6C0E42]"
					style={{
						borderRadius: '45px 50px 48px 52px',
						boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 8px 10px 0 rgba(89,50,43,0.9)',
					}}
				>
					{/* Screen inner */}
					<div
						className="relative border-6 border-[#333] bg-[#] p-4 sm:p-6 md:p-8 overflow-hidden"
						style={{
							borderRadius: '35px 40px 38px 42px',
							boxShadow: 'inset 0 0 50px rgba(255,252,199,0.8)',
							minHeight: 'clamp(400px, 60vh, 600px)',
						}}
					>
						{/* CRT scanlines effect */}
						<div
							className="absolute inset-0 pointer-events-none z-10"
							style={{
								background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
							}}
						/>
						{/* Screen glow */}
						<div
							className="absolute inset-0 pointer-events-none z-0"
							style={{
								background: 'radial-gradient(ellipse at center, rgba(85,255,170,0.05) 0%, transparent 70%)',
							}}
						/>
						{/* Content */}
						<div className="relative z-20">{children}</div>
					</div>
				</div>
			</div>
		</div>
	);
}