import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Maximize,
} from "lucide-react";

const MusicPlayer = ({
  track,
  onPlayNext,
  onPlayPrevious,
  onTogglePlay,
  isPlaying,
  onToggleShuffle,
  onToggleRepeat,
  shuffle,
  repeat,
  volume,
  onVolumeChange,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (onPlayNext) onPlayNext();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isDragging, onPlayNext]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent backdrop-blur-md border-t border-white/10 z-50">
      {/* Hidden audio element for actual playback */}
      <audio
        ref={audioRef}
        src={track.preview_url || track.external_urls?.spotify}
        onPlay={() => onTogglePlay(true)}
        onPause={() => onTogglePlay(false)}
      />

      {/* Player Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-purple-500 rounded-lg flex items-center justify-center">
              {track.album?.images?.[0] ? (
                <img
                  src={track.album.images[0].url}
                  alt={track.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Play className="h-8 w-8 text-white/80" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-white font-semibold truncate">
                {track.name}
              </h4>
              <p className="text-gray-400 text-sm truncate">
                {track.artists?.map((artist) => artist.name).join(", ")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Heart className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md mx-8">
            {/* Progress Bar */}
            <div className="flex items-center space-x-3 w-full">
              <span className="text-xs text-gray-400">
                {formatTime(currentTime)}
              </span>
              <div
                ref={progressRef}
                className="flex-1 bg-white/20 rounded-full h-1 cursor-pointer"
                onClick={handleProgressClick}
              >
                <div
                  className="bg-green-400 rounded-full h-1 transition-all"
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={onToggleShuffle}
                className={`p-2 transition-colors ${shuffle ? "text-green-400" : "text-gray-400 hover:text-white"}`}
              >
                <Shuffle className="h-5 w-5" />
              </button>

              <button
                onClick={onPlayPrevious}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                onClick={onTogglePlay}
                className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={onPlayNext}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2 transition-colors ${repeat ? "text-green-400" : "text-gray-400 hover:text-white"}`}
              >
                <Repeat className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <VolumeX
              className={`h-4 w-4 ${volume === 0 ? "text-green-400" : "text-gray-400 hover:text-white"}`}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-green-400"
            />
            <Volume2
              className={`h-4 w-4 ${volume > 0 ? "text-green-400" : "text-gray-400 hover:text-white"}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
