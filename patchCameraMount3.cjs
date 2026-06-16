const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const startOfEffect = '  // Load remaining scans on mount\\n  useEffect(() => {';
const endOfEffect = '  }, []);';
const chunk = code.substring(code.indexOf(startOfEffect), code.indexOf(endOfEffect) + endOfEffect.length);

const newChunk = [
  "  // Load remaining scans on mount",
  "  useEffect(() => {",
  "    let activeStream: MediaStream | null = null;",
  "    let timeoutId: any = null;",
  "    async function startCamera() {",
  "      try {",
  "        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {",
  "          throw new Error('Camera API not supported in this browser context. Try uploading standard image instead.');",
  "        }",
  "        const timeoutPromise = new Promise<MediaStream>((_, reject) => {",
  "          timeoutId = setTimeout(() => {",
  "            reject(new Error('Camera initialization timed out (3s limit reached).'));",
  "          }, 3000);",
  "        });",
  "        const mediaStream = await Promise.race([",
  "          navigator.mediaDevices.getUserMedia({ ",
  "            video: { facingMode: 'environment' }, ",
  "            audio: false ",
  "          }),",
  "          timeoutPromise",
  "        ]);",
  "        if (timeoutId) clearTimeout(timeoutId);",
  "        activeStream = mediaStream;",
  "        setStream(mediaStream);",
  "        setIsReady(true);",
  "      } catch (err: any) {",
  "        if (timeoutId) clearTimeout(timeoutId);",
  "        console.warn('Camera failed:', err.message);",
  "        setError(err.message || 'Unable to access camera.');",
  "        if ((err.name && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) || ",
  "            (err.message && err.message.toLowerCase().includes('denied'))) {",
  "           setShowPermissionModal(true);",
  "        }",
  "      }",
  "    }",
  "    startCamera();",
  "    return () => {",
  "      if (timeoutId) clearTimeout(timeoutId);",
  "      if (activeStream) {",
  "        activeStream.getTracks().forEach(track => {",
  "          try { track.stop(); } catch(e){}",
  "        });",
  "      }",
  "    };",
  "  }, []);",
  "  useEffect(() => {",
  "    if (isReady && videoRef.current && stream) {",
  "      videoRef.current.srcObject = stream;",
  "    }",
  "  }, [isReady, stream]);"
].join('\\n');

code = code.replace(chunk, newChunk);
fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('patched successfully with robust mount logic');
