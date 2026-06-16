const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const t = "        activeStream = mediaStream;\\n        setStream(mediaStream);\\n        if (videoRef.current) {\\n          videoRef.current.srcObject = mediaStream;\\n          setIsReady(true);\\n        }";
const newT = "        activeStream = mediaStream;\\n        setStream(mediaStream);\\n        setIsReady(true);\\n        setTimeout(() => {\\n          if (videoRef.current) {\\n             videoRef.current.srcObject = mediaStream;\\n          }\\n        }, 50);";

code = code.replace(t, newT);

fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('fixed camera mount logic');
