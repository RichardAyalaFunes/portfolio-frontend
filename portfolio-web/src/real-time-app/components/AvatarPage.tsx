// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { loadTemplate, renderTemplate, updateTemplateElements, toggleElementVisibility, addElementClass, removeElementClass } from '../utils/templateUtils';

interface AvatarPageProps {
  status: string;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onDisconnect: () => void;
  onProcessAudio: (audioBlob: Blob) => void;
  webhookUrl?: string;
  onSendText?: (text: string) => void;
}

/**
 * Componente de la página del avatar
 * Maneja la interacción con voz y visualización del avatar
 */
const AvatarPage: React.FC<AvatarPageProps> = ({
  status,
  error,
  videoRef,
  onDisconnect,
  onProcessAudio,
  webhookUrl,
  onSendText
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Referencias para grabación de audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Debug: Monitor audioBlob state changes
  useEffect(() => {
    console.log("audioBlob state changed:", {
      hasBlob: !!audioBlob,
      size: audioBlob?.size,
      type: audioBlob?.type
    });
  }, [audioBlob]);

  /**
   * Inicia la grabación de audio
   */
  const startRecording = async () => {
    try {
      console.log("Starting recording... Current state:", isRecording);
      
      // Clear any existing media recorder
      if (mediaRecorderRef.current) {
        console.log("Cleaning up previous mediaRecorder");
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.log("Error stopping previous recorder:", e);
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log("Got audio stream:", stream);
      
      // Use a specific MIME type and bitrate for better compatibility
      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      // Try to create with options, fall back to default if not supported
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log("MediaRecorder created with options:", options);
      } catch (e) {
        console.warn("MediaRecorder with options not supported, using default:", e);
        mediaRecorder = new MediaRecorder(stream);
      }
      
      console.log("MediaRecorder created:", mediaRecorder, "state:", mediaRecorder.state);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      // Set up data collection
      audioChunksRef.current = [];
      
      // Capture data every second during recording for better reliability
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available event received, data size:", event.data.size, "bytes");
        if (event.data.size > 0) {
          console.log("Adding audio chunk to collection");
          audioChunksRef.current.push(event.data);
        } else {
          console.warn("Received empty audio data chunk");
        }
      };
      
      // Set timeslice to collect data every 1 second
      const timeslice = 1000; // 1 second

      mediaRecorder.onstop = () => {
        console.log("MediaRecorder onstop event fired");
        console.log("Audio chunks collected:", audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          console.error("No audio chunks collected during recording");
          updateStatusText("Error: No se capturó audio. Intente de nuevo.");
          setIsRecording(false);
          return;
        }
        
        console.log("Creating audio blob...");
        let audioBlob;
        
        try {
          // Create a WAV blob for better compatibility (like in AudioTestPage)
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          console.log("Audio blob created successfully, size:", audioBlob.size, "bytes, type: audio/wav");
          
          // Log detailed info about the audio chunks
          console.log("Audio chunks info:", audioChunksRef.current.map(chunk => ({
            size: chunk.size,
            type: chunk.type
          })));
          
          if (audioBlob.size < 100) {
            console.warn("Warning: Audio blob is suspiciously small:", audioBlob.size, "bytes");
          }
          
          // Store the blob in state for playback, download and processing
          console.log("Setting audioBlob state with blob:", {
            size: audioBlob.size,
            type: audioBlob.type
          });
          setAudioBlob(audioBlob);
          console.log("audioBlob state set successfully");
          
          // Stop all tracks
          stream.getTracks().forEach(track => {
            console.log("Stopping track:", track.kind);
            track.stop();
          });
          
          // Calculate final duration
          const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingDuration(finalDuration);
          
          // Clear interval
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }
          
          // Update UI
          setIsRecording(false);
          setIsProcessing(true);
          updateUI();
          updateStatusText(`Recording completed (${finalDuration}s) - Processing automatically...`);
          
          console.log("Recording completed successfully");
          
          // Automatically send the audio to webhook
          console.log("Auto-sending audio to webhook after recording completion");
          setTimeout(() => {
            console.log("Sending audio blob directly to webhook:", {
              size: audioBlob.size,
              type: audioBlob.type
            });
            sendAudioDataToWebhook(audioBlob);
          }, 500); // Small delay to ensure UI updates
        } catch (error) {
          console.error("Error creating audio blob:", error);
          updateStatusText(`Error creating audio file: ${error.message}`);
          setIsRecording(false);
        }
      };

      // Start recording with timeslice to get data during recording
      console.log("Starting MediaRecorder with timeslice:", timeslice);
      mediaRecorder.start(timeslice);
      setIsRecording(true);
      
      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
        updateStatusText(`Recording... ${elapsed}s`);
      }, 1000);
      
      updateUI();
      console.log("Recording started successfully");
    } catch (err: any) {
      console.error("Error starting recording:", err);
      updateStatusText(`Error accessing microphone: ${err.message}`);
    }
  };

  /**
   * Detiene la grabación de audio
   */
  const stopRecording = () => {
    console.log("stopRecording called, current state:", isRecording, "mediaRecorder:", mediaRecorderRef.current?.state);
    
    if (mediaRecorderRef.current) {
      try {
        console.log("Stopping mediaRecorder...");
        
        // Ensure we request data before stopping
        mediaRecorderRef.current.requestData();
        
        // Stop the recorder
        mediaRecorderRef.current.stop();
        console.log("MediaRecorder stop command issued");
        
        // Set isRecording to false immediately to update UI
        setIsRecording(false);
        
        // Clear interval immediately
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
          console.log("Duration interval cleared");
        }
        
        // The rest will be handled in the onstop event
        updateStatusText("Finalizing recording...");
      } catch (err) {
        console.error("Error stopping recording:", err);
        updateStatusText(`Error stopping recording: ${err}`);
        
        // Force reset state in case of error
        setIsRecording(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      }
    } else {
      console.warn("No mediaRecorder found to stop");
      setIsRecording(false);
    }
  };

  /**
   * Descarga el archivo de audio grabado
   */
  const downloadAudio = () => {
    if (!audioBlob) {
      console.log("No audio blob available for download");
      updateStatusText("No hay audio grabado para descargar");
      return;
    }

    console.log("Downloading audio, blob size:", audioBlob.size, "bytes, type:", audioBlob.type);
    
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("Audio file downloaded");
    updateStatusText("Audio descargado correctamente");
  };

  /**
   * Función auxiliar para enviar datos de audio al webhook
   */
  const sendAudioDataToWebhook = async (audioData: Blob): Promise<void> => {
    try {
      console.log("Sending audio data to webhook:", webhookUrl);
      console.log("Audio data details:", {
        size: audioData.size,
        type: audioData.type
      });
      
      setIsProcessing(true);
      updateStatusText("Processing your message... This may take up to 8 seconds");
      
      // Crear FormData para envío multipart/form-data
      const formData = new FormData();
      
      // Determinar el nombre del archivo basado en el tipo MIME
      let filename = 'recording.webm';
      if (audioData.type.includes('wav')) {
        filename = 'recording.wav';
      } else if (audioData.type.includes('mp3')) {
        filename = 'recording.mp3';
      } else if (audioData.type.includes('ogg')) {
        filename = 'recording.ogg';
      }
      
      // Agregar el archivo de audio al FormData
      // n8n típicamente espera el campo 'audio' o 'file'
      formData.append('audio', audioData, filename);
      
      // Agregar metadatos adicionales que n8n puede usar
      formData.append('filename', filename);
      formData.append('timestamp', new Date().toISOString());
      formData.append('duration', recordingDuration.toString());
      formData.append('fileSize', audioData.size.toString());
      
      console.log("FormData prepared with fields:", {
        audio: `${filename} (${audioData.size} bytes)`,
        filename,
        timestamp: new Date().toISOString(),
        duration: recordingDuration,
        fileSize: audioData.size
      });
      
      // Enviar POST request con FormData
      const response = await fetch(webhookUrl!, {
        method: 'POST',
        body: formData,
        // No establecer Content-Type manualmente - el navegador lo hará automáticamente
        // con el boundary correcto para multipart/form-data
      });

      console.log("Webhook response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`Error del webhook: ${response.status} ${response.statusText}`);
      }
      
      // Procesar respuesta del webhook
      try {
        const result = await response.json();
        console.log("Webhook response JSON:", result);
        
        // Extraer el campo 'output' que contiene las expresiones para el avatar
        if (result.output) {
          const avatarScript = result.output;
          console.log("=== AVATAR SCRIPT FROM N8N ===");
          console.log("Output key value:", avatarScript);
          console.log("Script length:", avatarScript.length);
          console.log("Script preview:", avatarScript.substring(0, 100) + (avatarScript.length > 100 ? "..." : ""));
          console.log("=== END AVATAR SCRIPT ===");
          
          // Mostrar el script en la interfaz
          setTranscript(avatarScript);
          setIsProcessing(false);
          updateStatusText("Response received! The AI is now speaking...");
          
          // Send the script to the avatar
          if (onSendText) {
            console.log("Sending script to avatar:", avatarScript);
            onSendText(avatarScript);
          }
        } else {
          console.log("No 'output' key found in webhook response");
          console.log("Available keys:", Object.keys(result));
          updateStatusText(`Audio sent successfully, but 'output' field not found`);
        }
        
      } catch (jsonErr: any) {
        console.log("Response is not JSON, getting as text");
        const textResponse = await response.text();
        console.log("Webhook response text:", textResponse);
        updateStatusText(`Audio sent successfully: ${textResponse}`);
        
        // Si la respuesta es texto plano, tratarla como script
        if (textResponse && textResponse.trim()) {
          setTranscript(textResponse);
          setIsProcessing(false);
          updateStatusText("Response received! The AI is now speaking...");
        }
      }
      
    } catch (err: any) {
      console.error("Error sending audio data to webhook:", err);
      setIsProcessing(false);
      updateStatusText(`Error sending audio: ${err.message}`);
    }
  };

  /**
   * Envía el archivo de audio al webhook usando POST con FormData
   */
  const sendAudioToWebhook = async (): Promise<void> => {
    console.log("sendAudioToWebhook called");
    console.log("Current audioBlob state:", audioBlob);
    console.log("Webhook URL:", webhookUrl);
    
    if (!webhookUrl) {
      console.error("No webhook URL configured");
      updateStatusText("Error: URL del webhook no configurada");
      return;
    }

    if (!audioBlob) {
      console.error("No audio blob available");
      updateStatusText("Error: No hay audio grabado para enviar");
      return;
    }

    console.log("Proceeding to send audio data to webhook...");
    // Use the audioBlob state directly
    await sendAudioDataToWebhook(audioBlob);
  };
  
  /**
   * Reproduce el audio grabado
   */
  const playAudio = () => {
    if (!audioBlob) {
      console.log("No audio blob available for playback");
      updateStatusText("No hay audio grabado para reproducir");
      return;
    }

    console.log("Playing audio, blob size:", audioBlob.size, "bytes, type:", audioBlob.type);
    
    // The audio player is automatically updated in the updateUI function
    // Just make sure the audio controls are visible
    if (containerRef.current) {
      const audioPlayer = containerRef.current.querySelector('#audio-player') as HTMLAudioElement;
      if (audioPlayer) {
        audioPlayer.play().catch(err => {
          console.error("Error playing audio:", err);
          updateStatusText(`Error al reproducir audio: ${err.message}`);
        });
      }
    }
    
    updateStatusText("Reproduciendo audio grabado...");
  };

  /**
   * Actualiza la interfaz de usuario según el estado actual
   */
  const updateUI = () => {
    // Only log when there are significant state changes
    if (isRecording || isProcessing || audioBlob) {
      console.log("updateUI called with audioBlob:", !!audioBlob, "isRecording:", isRecording, "isProcessing:", isProcessing);
    }
    if (!containerRef.current) return;

    // Actualizar botón de grabación
    const recordingButton = containerRef.current.querySelector('#recording-button');
    const recordingButtonText = containerRef.current.querySelector('#recording-button-text');
    
    if (recordingButton && recordingButtonText) {
      // Remove all state classes first
      removeElementClass(containerRef.current, 'recording-button', 'recording');
      removeElementClass(containerRef.current, 'recording-button', 'processing');
      
      if (isRecording) {
        recordingButtonText.textContent = 'Stop Recording';
        addElementClass(containerRef.current, 'recording-button', 'recording');
      } else if (isProcessing) {
        recordingButtonText.textContent = 'Processing...';
        addElementClass(containerRef.current, 'recording-button', 'processing');
      } else {
        recordingButtonText.textContent = 'Start Recording';
      }
    }

    // Actualizar estado de grabación
    const recordingStatus = containerRef.current.querySelector('#recording-status');
    if (recordingStatus) {
      if (isRecording) {
        recordingStatus.textContent = `Recording... ${recordingDuration}s (Click "Stop Recording" when finished)`;
      } else if (isProcessing) {
        recordingStatus.textContent = 'Processing your message... This may take up to 8 seconds';
      } else {
        recordingStatus.textContent = 'Click "Start Recording" to begin your message';
      }
    }

    // Botones y controles ocultos para interfaz de avatar en tiempo real
    // Los elementos están comentados en el HTML para uso futuro
    // toggleElementVisibility(containerRef.current, 'process-button', false);
    // toggleElementVisibility(containerRef.current, 'download-button', false);
    // toggleElementVisibility(containerRef.current, 'play-button', false);
    // toggleElementVisibility(containerRef.current, 'audio-controls', false);
    
    // Configurar reproductor de audio (comentado para interfaz de avatar en tiempo real)
    // if (audioBlob) {
    //   console.log("Configuring audio player with blob:", {
    //     size: audioBlob.size,
    //     type: audioBlob.type
    //   });
    //   const audioPlayer = containerRef.current.querySelector('#audio-player') as HTMLAudioElement;
    //   if (audioPlayer) {
    //     const url = URL.createObjectURL(audioBlob);
    //     audioPlayer.src = url;
    //     console.log("Audio player src set to:", url);
    //   } else {
    //     console.error("Audio player element not found!");
    //   }

    //   // Actualizar información de grabación
    //   updateTemplateElements(containerRef.current, {
    //     'duration': recordingDuration.toString(),
    //     'file-size': Math.round(audioBlob.size / 1024).toString()
    //   });
    // } else {
    //   console.log("No audioBlob available for audio player configuration");
    // }
  };

  /**
   * Actualiza el texto de estado
   */
  const updateStatusText = (text: string) => {
    if (!containerRef.current) return;
    updateTemplateElements(containerRef.current, {
      'status-text': text
    });
  };

  /**
   * Limpia los recursos de grabación
   */
  const cleanupRecording = () => {
    console.log("Cleaning up recording resources");
    
    // Stop any active recording
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.log("Error stopping mediaRecorder during cleanup:", e);
      }
    }
    
    // Clear interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Reset state
    setIsRecording(false);
    setIsProcessing(false);
  };

  /**
   * Carga la plantilla y configura los eventos
   */
  useEffect(() => {
    const loadAvatarTemplate = async () => {
      if (containerRef.current) {
        try {
          console.log("Loading avatar template...");
          const templateHtml = await loadTemplate('/templates/avatar-page.html');
          renderTemplate(containerRef.current, templateHtml);
          
          // Configurar eventos
          const disconnectButton = containerRef.current.querySelector('#disconnect-button');
          const recordingButton = containerRef.current.querySelector('#recording-button');
          const processButton = containerRef.current.querySelector('#process-button');
          // Botones ocultos para interfaz de avatar en tiempo real
          // const downloadButton = containerRef.current.querySelector('#download-button');
          // const playButton = containerRef.current.querySelector('#play-button');

          if (disconnectButton) {
            disconnectButton.addEventListener('click', onDisconnect);
          }

          if (recordingButton) {
            recordingButton.addEventListener('click', (e) => {
              e.preventDefault();
              
              // Use the button text content as a reliable indicator
              const buttonText = containerRef.current?.querySelector('#recording-button-text')?.textContent;
              console.log("Recording button clicked, button text:", buttonText);
              
              // Don't allow clicks during processing
              if (buttonText === 'Processing...') {
                console.log("Button clicked during processing, ignoring");
                return;
              }
              
              if (buttonText === 'Stop Recording') {
                console.log("Stopping recording based on button text");
                stopRecording();
              } else if (buttonText === 'Start Recording') {
                console.log("Starting recording based on button text");
                startRecording();
              }
              // Note: "Processing..." state is handled by the guard clause above
            });
          }

          if (processButton) {
            processButton.addEventListener('click', () => {
              console.log("Process button clicked - sending audio to webhook");
              sendAudioToWebhook();
            });
          }

          // Event listeners para botones ocultos (comentados para interfaz de avatar en tiempo real)
          // if (downloadButton) {
          //   downloadButton.addEventListener('click', downloadAudio);
          // }
          
          // if (playButton) {
          //   playButton.addEventListener('click', playAudio);
          // }

          // Configurar video
          const videoElement = containerRef.current.querySelector('#avatar-video') as HTMLVideoElement;
          if (videoElement) {
            console.log("Setting up video element during template loading");
            
            // Make sure the video element has the correct attributes
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            
            // Assign this element to the React ref
            (videoRef as any).current = videoElement;
            
            // If there's a MediaStream available, set it
            if (videoRef.current && videoRef.current.srcObject) {
              console.log("Setting srcObject from parent component");
              videoElement.srcObject = videoRef.current.srcObject;
            } else {
              console.log("No srcObject available during template loading");
            }
          } else {
            console.error("Video element not found during template loading!");
          }

          // Initial UI update
          updateUI();
          updateStatusText(status);
        } catch (error) {
          console.error('Error cargando plantilla del avatar:', error);
        }
      }
    };

    loadAvatarTemplate();
    
    // Cleanup function when component unmounts
    return () => {
      cleanupRecording();
    };
  }, []);

  /**
   * Actualiza la UI cuando cambia el estado de grabación
   */
  useEffect(() => {
    // Only log when there are significant state changes
    if (isRecording || isProcessing || audioBlob) {
      console.log("UI update effect triggered. isRecording:", isRecording, "audioBlob:", !!audioBlob, "duration:", recordingDuration, "isProcessing:", isProcessing);
    }
    updateUI();
  }, [isRecording, audioBlob, recordingDuration, isProcessing]);

  /**
   * Actualiza el estado y los errores
   */
  useEffect(() => {
    if (containerRef.current) {
      // Actualizar estado
      updateStatusText(status);

      // Mostrar/ocultar errores
      toggleElementVisibility(containerRef.current, 'avatar-error-container', !!error);
      if (error) {
        updateTemplateElements(containerRef.current, {
          'avatar-error-message': error
        });
      }

      // Mostrar/ocultar transcripción
      toggleElementVisibility(containerRef.current, 'transcript-container', !!transcript);
      if (transcript) {
        updateTemplateElements(containerRef.current, {
          'transcript-text': `"${transcript}"`
        });
      }
    }
  }, [status, error, transcript]);

  // Efecto para monitorear cambios en el videoRef y aplicarlos al elemento HTML
  useEffect(() => {
    // This effect runs whenever status changes, which happens when the stream connects
    console.log("Video monitor effect triggered - checking for MediaStream");
    
    const checkForMediaStream = () => {
      if (containerRef.current) {
        const videoElement = containerRef.current.querySelector('#avatar-video') as HTMLVideoElement;
        
        if (videoElement) {
          // First, ensure the video element is properly set up
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          
          // Make sure the React ref points to our HTML element
          if ((videoRef as any).current !== videoElement) {
            console.log("Updating videoRef to point to HTML element");
            (videoRef as any).current = videoElement;
          }
          
          // Check if there's a global mediaStream variable in App.tsx
          // This is a hack to access the mediaStream from the parent component
          const globalMediaStream = (window as any).mediaStream;
          
          if (globalMediaStream && !videoElement.srcObject) {
            console.log("Found global mediaStream, applying to video element");
            videoElement.srcObject = globalMediaStream;
            videoElement.play().catch(err => console.error("Error playing video:", err));
          } else if (videoRef.current && videoRef.current.srcObject && !videoElement.srcObject) {
            console.log("Found srcObject in videoRef, applying to video element");
            videoElement.srcObject = videoRef.current.srcObject;
            videoElement.play().catch(err => console.error("Error playing video:", err));
          }
        }
      }
    };
    
    // Check immediately
    checkForMediaStream();
    
    // Set up a periodic check for MediaStream (only if no stream is present)
    const intervalId = setInterval(() => {
      if (containerRef.current) {
        const videoElement = containerRef.current.querySelector('#avatar-video') as HTMLVideoElement;
        // Only check if video element exists and doesn't have a stream yet
        if (videoElement && !videoElement.srcObject) {
          checkForMediaStream();
        }
      }
    }, 2000); // Reduced frequency to 2 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [status]); // Re-run when status changes, which happens when stream connects

  return <div ref={containerRef} />;
};

export default AvatarPage;
