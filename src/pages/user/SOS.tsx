import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn, supabase } from '../../lib/utils';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const driverActiveIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(249,115,22,0.8)] flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const userIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function SOS() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const serviceId = searchParams.get('service');
  
  const [status, setStatus] = useState<'IDLE' | 'SEARCHING' | 'FOUND'>('IDLE');
  const [eta, setEta] = useState<number | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState({ lat: 12.9716, lng: 77.5946 });
  const [driverLoc, setDriverLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(
          p => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
          (e) => { console.warn("SOS GPS Error", e); },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
       );
    }
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel;
    let trackChannel: RealtimeChannel;

    if (requestId && import.meta.env.VITE_SUPABASE_URL) {
      // Listen for realtime DB updates on this specific request
      channel = supabase
        .channel(`request_${requestId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${requestId}` }, (payload) => {
          if (payload.new.status === 'accepted') {
            setStatus('FOUND');
            setEta(12);
            
            // Subscribe to the driver's high-frequency broadcast channel
            trackChannel = supabase.channel(`tracking_${requestId}`);
            trackChannel.on('broadcast', { event: 'location' }, (payload) => {
               setDriverLoc({ lat: payload.payload.lat, lng: payload.payload.lng });
            }).subscribe();
          } else if (payload.new.status === 'completed') {
            window.location.href = '/home'; // return home when driver marks it done
          }
        })
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (trackChannel) supabase.removeChannel(trackChannel);
    };
  }, [requestId]);

  const handleSOS = async () => {
    setStatus('SEARCHING');
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
         // Fallback if no supabase config
         setTimeout(() => { setStatus('FOUND'); setEta(12); }, 3000);
         return;
      }

      // Automatically assign nearest provider or leave provider_id null for broadcasting
      const { data, error } = await supabase.from('requests').insert({
        user_id: user?.id,
        service_id: serviceId || '10000000-0000-0000-0000-000000000001', // Should be dynamic
        user_location: userLoc,
        status: 'requested'
      }).select().single();

      if (data) {
        setRequestId(data.id);
      }
      
    } catch (e) {
      console.error(e);
      setStatus('IDLE');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <AnimatePresence mode="wait">
        {status === 'IDLE' && (
          <motion.div 
            key="idle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-red-500 mb-2">Emergency Help</h1>
              <p className="text-white/60">Tap the button below to instantly broadcast your distress signal.</p>
            </div>
            
            <button 
              onClick={handleSOS}
              className="relative w-48 h-48 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center neon-pulse-red group border-4 border-red-400 shadow-2xl"
            >
              <AlertTriangle className="w-20 h-20 text-white group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </button>
          </motion.div>
        )}

        {status === 'SEARCHING' && (
          <motion.div 
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
             <Loader2 className="w-16 h-16 text-red-500 animate-spin mb-6" />
             <h2 className="text-2xl font-bold mb-2">Finding Providers...</h2>
             <p className="text-white/60 mb-6">Locating the nearest roadside assistance.</p>
             <p className="text-xs text-orange-400 border border-orange-400/50 bg-orange-400/10 px-4 py-2 rounded-full">Broadcasting location data...</p>
          </motion.div>
        )}

        {status === 'FOUND' && (
          <motion.div 
            key="found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-[70vh] flex flex-col pt-4"
          >
             <div className="flex-1 rounded-[32px] overflow-hidden glass p-1 shadow-2xl relative border border-white/20 z-0">
               <MapContainer
                  center={[userLoc.lat, userLoc.lng]}
                  zoom={14}
                  style={{ width: '100%', height: '100%', borderRadius: '28px', zIndex: 0 }}
                  zoomControl={false}
               >
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                 <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon} />
                 {driverLoc && (
                    <>
                       <Polyline 
                           positions={[[userLoc.lat, userLoc.lng], [driverLoc.lat, driverLoc.lng]]} 
                           color="#f97316" 
                           dashArray="5, 10" 
                           weight={3}
                           opacity={0.7}
                       />
                       <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverActiveIcon}>
                          <Popup className="text-black font-bold">Driver is here</Popup>
                       </Marker>
                    </>
                 )}
               </MapContainer>
               
               {/* Overlay Info Card */}
               <div className="absolute bottom-4 left-4 right-4 z-[400] glass-dark rounded-[24px] p-4 shadow-2xl border border-white/10">
                 <h2 className="text-xl font-bold mb-1 text-white">Help is on the way!</h2>
                 <p className="text-white/60 text-sm mb-4">A provider is actively navigating to your coordinates.</p>
                 
                 <div className="bg-black/60 rounded-2xl p-3 flex flex-row justify-between items-center mb-4 shadow-inner border border-white/5">
                   <p className="text-xs text-white/50 uppercase tracking-widest font-semibold ml-2">ETA</p>
                   <p className="text-3xl font-mono font-bold text-orange-400 text-glow mr-2">{eta} <span className="text-sm text-white/50">mins</span></p>
                 </div>

                 <button className="w-full bg-red-600/20 text-red-500 border border-red-500/30 py-3 rounded-xl hover:bg-red-600/40 transition-colors font-bold uppercase tracking-wider text-xs">
                   Cancel Request
                 </button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

