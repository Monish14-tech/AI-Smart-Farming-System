import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export const getSocketServerUrl = (): string => {
  const isBrowser = typeof window !== 'undefined';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const isLocal = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  let base = apiUrl;
  if (!base || (isBrowser && !isLocal && base.includes('localhost'))) {
    base = 'https://ai-smart-farming-system-2.onrender.com';
  } else {
    base = base.replace(/\/api\/?$/, '');
  }

  return base.replace(/\/api\/?$/, '');
};

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    const url = getSocketServerUrl();
    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketInstance.on('connect', () => {
      console.log('📡 [SOCKET.IO] Connected to AgriNova Telematics Server:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 [SOCKET.IO] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [SOCKET.IO] Connection error:', err.message);
    });
  }

  return socketInstance;
};
