import { ReactNode } from 'react';

interface ArcadeFrameProps {
  children: ReactNode;
}

export function ArcadeFrame({ children }: ArcadeFrameProps) {
  return (
    <div className="relative flex items-center justify-center min-h-screen w-full p-8">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .power-light {
          animation: blink 3s ease-in-out infinite;
        }
      `}} />

      {/* Arcade Cabinet */}
      <div className="relative" style={{ maxWidth: '1600px', width: '100%' }}>
        {/* Top title */}
        <div 
          className="relative mx-auto mb-4 p-6 border-4 border-[#FFFCC7] bg-[#D54751]"
          style={{
            width: '85%',
            borderRadius: '60px 60px 60px 60px',
            boxShadow: '4px 6px 0 rgba(89,50,43, 0.9)',
            transform: 'rotate(-0.4deg)',
          }}
        >
          <div className="text-center">
            <div 
              className="font-cupcake text-[#FFFCC7] text-5xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}>
              PONG
            </div>
          </div>
        </div>

        {/* Main screen bezel */}
        <div 
          className="relative p-8 border-8 border-[#FFFCC7] bg-[#D54751]"
          style={{
            borderRadius: '45px 50px 48px 52px',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 8px 10px 0 rgba(89,50,43,0.9)',
            transform: 'rotate(-0.3deg)',
          }}
        >
          {/* Screen inner bezel */}
          <div 
            className="relative border-6 border-[#333] bg-[#] p-8 overflow-hidden"
            style={{
              borderRadius: '35px 40px 38px 42px',
              boxShadow: 'inset 0 0 50px rgba(255,252,199,0.8)',
              minHeight: '600px',
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
            <div className="relative z-20">
              {children}
            </div>
          </div>

          {/* Control panel decorations */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-8 items-center">
          </div>
        </div>

        {/* Bottom control panel */}
        <div 
          className="relative mx-auto mt-4 p-4 border-4 border-white bg-[#D54751]"
          style={{
            width: '90%',
            borderRadius: '60px 60px 60px 60px',
            boxShadow: '4px 5px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="flex justify-center gap-12 items-center">
            {/* Joystick representation 
            <div className="flex flex-col items-center gap-2">
              <svg width="60" height="80" viewBox="0 0 60 80">
                <circle cx="30" cy="60" r="18" fill="#333" stroke="white" strokeWidth="2"/>
                <rect x="26" y="20" width="8" height="45" fill="white" rx="4"/>
                <circle cx="30" cy="20" r="10" fill="#ff5555" stroke="white" strokeWidth="2"/>
                <path d="M20,75 L40,75" stroke="white" strokeWidth="2" opacity="0.5"/>
              </svg>
            </div>*/}

            {/* Buttons representation */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-4">
                <div 
                  className="w-12 h-12 rounded-full border-3 border-white bg-[#55ffaa]"
                  style={{ 
                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.3)',
                    borderRadius: '50% 48% 52% 50%'
                  }}
                />
                <div 
                  className="w-12 h-12 rounded-full border-3 border-white bg-[#ff5555]"
                  style={{ 
                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.3)',
                    borderRadius: '50% 48% 52% 50%'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}