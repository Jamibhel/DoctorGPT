"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  Square, 
  Upload, 
  Play, 
  Pause, 
  Sparkles, 
  FileAudio, 
  RefreshCw, 
  Volume2, 
  Check, 
  SlidersHorizontal 
} from "lucide-react";
import { ConsultationPreset } from "@/lib/data/sample-consultations";

interface AudioRecorderProps {
  presets: ConsultationPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: ConsultationPreset) => void;
  onStartTranscription: (textOrAudio: string | Blob) => void;
  isTranscribing: boolean;
  onLogAudit: (action: string, details: string, category: 'AI_GENERATION') => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  onStartTranscription,
  isTranscribing,
  onLogAudit,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [inputMode, setInputMode] = useState<'preset' | 'mic' | 'upload'>('preset');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      onLogAudit("Ambient Audio Capture Started", "Microphone stream opened for live clinical consultation.", "AI_GENERATION");
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Unable to access microphone. You can test immediately using the synthetic consultation presets below!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      onLogAudit("Ambient Audio Capture Stopped", `Recorded ${recordingSeconds}s consultation audio.`, "AI_GENERATION");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setRecordedBlob(file);
      const url = URL.createObjectURL(file);
      setRecordedAudioUrl(url);
      onLogAudit("Audio File Uploaded", `Encounter audio uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB).`, "AI_GENERATION");
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activePreset = presets.find(p => p.id === selectedPresetId) || presets[0];

  const handleProcessEncounter = () => {
    if (inputMode === 'preset' && activePreset) {
      const fullText = activePreset.dialogue
        .map(d => `${d.speaker} [${d.timestamp}]: ${d.text}`)
        .join("\n\n");
      onStartTranscription(fullText);
    } else if (recordedBlob) {
      onStartTranscription(recordedBlob);
    } else {
      // fallback
      onStartTranscription(activePreset.dialogue.map(d => `${d.speaker}: ${d.text}`).join("\n"));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      {/* Title & Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <FileAudio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Encounter Audio & Input</h3>
            <p className="text-[11px] text-slate-500">Capture ambient conversation or load synthetic clinical audio fixture</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
          <button
            onClick={() => setInputMode('preset')}
            className={`px-2.5 py-1 rounded-md transition ${
              inputMode === 'preset' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Presets ($0)
          </button>
          <button
            onClick={() => setInputMode('mic')}
            className={`px-2.5 py-1 rounded-md transition ${
              inputMode === 'mic' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Live Mic
          </button>
          <button
            onClick={() => setInputMode('upload')}
            className={`px-2.5 py-1 rounded-md transition ${
              inputMode === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Content based on Mode */}
      {inputMode === 'preset' && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Select Clinical Scenario:</span>
            <span className="text-[11px] text-slate-400">Multi-speaker consultation fixtures</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`p-2.5 rounded-lg text-left transition border ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {preset.encounterType.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDuration(preset.audioDurationSeconds)}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-900 line-clamp-1">{preset.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>{preset.dialogue.length} dialogue turns</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Preset Preview info */}
          {activePreset && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-800">
                  Ready: <strong>{activePreset.title}</strong>
                </span>
                <span className="text-slate-400">({formatDuration(activePreset.audioDurationSeconds)})</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Synthetic Dialogue Ingested
              </span>
            </div>
          )}
        </div>
      )}

      {inputMode === 'mic' && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="mb-3">
            {isRecording ? (
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-ping absolute inset-0 opacity-75" />
                <button
                  onClick={stopRecording}
                  className="relative w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition"
              >
                <Mic className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="font-mono text-base font-bold text-slate-800 mb-1">
            {formatDuration(recordingSeconds)}
          </div>
          <p className="text-xs text-slate-500 max-w-xs">
            {isRecording
              ? "Ambient microphone listening... speak naturally as in a doctor-patient encounter."
              : recordedBlob
              ? "Recording captured! Click 'Transcribe & Process' below."
              : "Click the microphone button to start live consultation capture."}
          </p>

          {/* Simple audio visualizer bar simulation when recording */}
          {isRecording && (
            <div className="flex items-center gap-1 mt-3">
              {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${height * 0.25}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {inputMode === 'upload' && (
        <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-400 text-center transition">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 mb-1">
            {uploadedFileName || "Upload consultation audio file"}
          </p>
          <p className="text-[11px] text-slate-500 mb-3">Supports WAV, MP3, M4A, WEBM</p>
          <label className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs">
            <span>Browse Files</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Main Process Button */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Ready to transcribe and extract clinical structured notes.
        </div>
        <button
          onClick={handleProcessEncounter}
          disabled={isTranscribing}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
        >
          {isTranscribing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Transcribing & Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transcribe & Process Encounter</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
