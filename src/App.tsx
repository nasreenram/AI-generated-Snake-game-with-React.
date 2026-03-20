import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RotateCcw, Trophy, Music, Gamepad2 } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEED = 120;

const TRACKS = [
  { id: 1, title: 'Cybernetic Pulse', artist: 'AI Gen Alpha', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Neon Overdrive', artist: 'AI Gen Beta', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Synthwave Dream', artist: 'AI Gen Gamma', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const generateFood = (snake: {x: number, y: number}[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const directionRef = useRef(INITIAL_DIRECTION);
  const lastProcessedDirectionRef = useRef(INITIAL_DIRECTION);
  
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Snake Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGameRunning(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !isGameRunning && !gameOver) {
        setIsGameRunning(true);
        return;
      }

      if (e.key === ' ' && gameOver) {
        resetGame();
        return;
      }

      const lastDir = lastProcessedDirectionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (lastDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (lastDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (lastDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (lastDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const currentDir = directionRef.current;
        lastProcessedDirectionRef.current = currentDir;
        
        const newHead = {
          x: head.x + currentDir.x,
          y: head.y + currentDir.y,
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameInterval);
  }, [isGameRunning, gameOver, food, highScore]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.log("Audio play prevented:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-neon-pink/30">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-pink/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="mb-8 text-center z-10">
        <h1 className="text-5xl font-black tracking-tighter uppercase neon-text-cyan mb-2 flex items-center justify-center gap-4">
          <Gamepad2 className="w-10 h-10" />
          Neon Snake
          <Music className="w-10 h-10" />
        </h1>
        <p className="text-gray-400 tracking-widest uppercase text-sm font-semibold">Beats & Bytes</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start z-10 w-full max-w-6xl justify-center">
        
        {/* Game Container */}
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 uppercase text-xs font-bold tracking-wider">Score</span>
              <span className="text-2xl font-mono neon-text-green">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-neon-pink" />
              <span className="text-gray-400 uppercase text-xs font-bold tracking-wider">High</span>
              <span className="text-2xl font-mono neon-text-pink">{highScore}</span>
            </div>
          </div>

          <div 
            className="relative bg-black/50 backdrop-blur-sm border-2 neon-border-cyan rounded-lg overflow-hidden"
            style={{ 
              width: `${GRID_SIZE * 20}px`, 
              height: `${GRID_SIZE * 20}px` 
            }}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10" 
                 style={{
                   backgroundImage: 'linear-gradient(var(--color-neon-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-neon-cyan) 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }}>
            </div>

            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute rounded-sm ${index === 0 ? 'bg-neon-green shadow-[0_0_10px_var(--color-neon-green)] z-10' : 'bg-neon-green/80'}`}
                style={{
                  width: '18px',
                  height: '18px',
                  left: `${segment.x * 20 + 1}px`,
                  top: `${segment.y * 20 + 1}px`,
                }}
              />
            ))}

            {/* Food */}
            <div
              className="absolute bg-neon-pink rounded-full shadow-[0_0_15px_var(--color-neon-pink)] animate-pulse"
              style={{
                width: '16px',
                height: '16px',
                left: `${food.x * 20 + 2}px`,
                top: `${food.y * 20 + 2}px`,
              }}
            />

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                <Gamepad2 className="w-16 h-16 text-neon-cyan mb-4 opacity-80" />
                <button 
                  onClick={() => setIsGameRunning(true)}
                  className="px-6 py-3 border border-neon-cyan text-neon-cyan font-bold uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all duration-300 rounded cursor-pointer"
                >
                  Press Space to Start
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
                <h2 className="text-4xl font-black uppercase neon-text-pink mb-2">Game Over</h2>
                <p className="text-gray-300 mb-6 font-mono">Final Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 px-6 py-3 border border-neon-pink text-neon-pink font-bold uppercase tracking-widest hover:bg-neon-pink hover:text-black transition-all duration-300 rounded cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-gray-500 text-xs uppercase tracking-widest flex gap-4">
            <span>Use WASD or Arrows to move</span>
            <span>Space to pause/start</span>
          </div>
        </div>

        {/* Music Player Container */}
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-green opacity-50"></div>
          
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Now Playing
            </h3>
            <div className="flex gap-1 h-4 items-end">
              {[1,2,3,4].map(i => (
                <div 
                  key={i} 
                  className={`w-1 bg-neon-pink rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} 
                  style={{ 
                    height: isPlaying ? `${Math.random() * 12 + 4}px` : '4px', 
                    animationDelay: `${i * 0.15}s` 
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold neon-text-cyan mb-1">{TRACKS[currentTrackIndex].title}</h2>
            <p className="text-gray-400 text-sm uppercase tracking-wider">{TRACKS[currentTrackIndex].artist}</p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8">
            <button 
              onClick={prevTrack}
              className="p-3 text-gray-400 hover:text-neon-cyan transition-colors cursor-pointer"
            >
              <SkipBack className="w-6 h-6" fill="currentColor" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-neon-pink text-black hover:scale-105 transition-transform shadow-[0_0_20px_var(--color-neon-pink)] cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" fill="currentColor" />
              ) : (
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              )}
            </button>
            
            <button 
              onClick={nextTrack}
              className="p-3 text-gray-400 hover:text-neon-cyan transition-colors cursor-pointer"
            >
              <SkipForward className="w-6 h-6" fill="currentColor" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <button onClick={toggleMute} className="hover:text-white transition-colors cursor-pointer">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Hidden Audio Element */}
          <audio 
            ref={audioRef}
            src={TRACKS[currentTrackIndex].url}
            onEnded={handleTrackEnd}
          />
        </div>

      </div>
    </div>
  );
}
