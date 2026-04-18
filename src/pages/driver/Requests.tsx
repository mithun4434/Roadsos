import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Navigation, CheckCircle, XCircle, MapPin } from 'lucide-react';
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

export default function DriverRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [myLoc, setMyLoc] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    if (!user || !import.meta.env.VITE_SUPABASE_URL) return;

    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(
          p => setMyLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
          (e) => { console.warn("Driver GPS Config Failed", e); },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
       );
    }

    // Fetch initial state
    const fetchJobs = async () => {
      // 1. Check if we have an active accepted job
      const { data: provData } = await supabase.from('providers').select('id').eq('user_id', user.id).single();
      if (!provData) return;

      const { data: active } = await supabase
        .from('requests')
        .select(`*, services(name)`)
        .eq('status', 'accepted')
        .eq('provider_id', provData.id)
        .limit(1)
        .single();
        
      if (active) {
         setActiveJob(active);
         // set simulated start slightly off user location
         setMyLoc({ lat: active.user_location.lat - 0.015, lng: active.user_location.lng - 0.01 });
         return; // Skip fetching requested if we have an active one
      }

      // 2. Fetch pending generic requested jobs
      const { data: reqs } = await supabase
        .from('requests')
        .select(`*, services(name)`)
        .eq('status', 'requested');
      if (reqs) setRequests(reqs);
    };
    fetchJobs();

    const channel = supabase
      .channel('public:requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests', filter: `status=eq.requested` }, payload => {
        // Only append if we aren't in a job
        setRequests(prev => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, payload => {
        if (payload.new.status !== 'requested') {
           setRequests(prev => prev.filter(r => r.id !== payload.new.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Driving Simulation & Broadcasting
  useEffect(() => {
    if (!activeJob || !import.meta.env.VITE_SUPABASE_URL) return;

    const channel = supabase.channel(`tracking_${activeJob.id}`);
    let interval: NodeJS.Timeout;

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        interval = setInterval(() => {
          setMyLoc(prev => {
            const dest = activeJob.user_location;
            const latDiff = dest.lat - prev.lat;
            const lngDiff = dest.lng - prev.lng;
            
            if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) return dest;

            const newLat = prev.lat + latDiff * 0.1;
            const newLng = prev.lng + lngDiff * 0.1;

            // Broadcast real-time location to User map
            channel.send({
              type: 'broadcast',
              event: 'location',
              payload: { lat: newLat, lng: newLng }
            });

            return { lat: newLat, lng: newLng };
          });
        }, 2000);
      }
    });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [activeJob]);

  const handleAccept = async (id: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
        setRequests(prev => prev.filter(r => r.id !== id));
        return;
    }

    // Get the provider ID for the current user
    const { data: provData } = await supabase.from('providers').select('id').eq('user_id', user?.id).single();

    if (provData) {
        await supabase
        .from('requests')
        .update({ status: 'accepted', provider_id: provData.id })
        .eq('id', id);

        const acceptedJob = requests.find(r => r.id === id);
        if (acceptedJob) {
           setActiveJob(acceptedJob);
           setMyLoc({ lat: acceptedJob.user_location.lat - 0.015, lng: acceptedJob.user_location.lng - 0.01 });
        }
    }
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const completeJob = async () => {
      if (!activeJob) return;
      await supabase.from('requests').update({ status: 'completed' }).eq('id', activeJob.id);
      setActiveJob(null);
  };

  if (activeJob) {
      return (
        <div className="p-4 space-y-4 pb-32 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="bg-green-500/20 text-green-400 font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full inline-block mb-2 border border-green-500/30">
             Active Mission
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Navigating to User</h1>
          
          <section className="relative w-full rounded-[24px] overflow-hidden glass shadow-2xl p-1 border border-orange-500/50 z-0 h-[300px]">
            <MapContainer
              center={[activeJob.user_location.lat - 0.007, activeJob.user_location.lng - 0.005]}
              zoom={14}
              style={{ width: '100%', height: '100%', zIndex: 0 }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <Polyline 
                  positions={[[activeJob.user_location.lat, activeJob.user_location.lng], [myLoc.lat, myLoc.lng]]} 
                  color="#f97316" 
                  dashArray="5, 10" 
                  weight={3}
                  opacity={0.7}
              />
              <Marker position={[activeJob.user_location.lat, activeJob.user_location.lng]} icon={userIcon} />
              <Marker position={[myLoc.lat, myLoc.lng]} icon={driverActiveIcon}>
                 <Popup className="text-black font-bold">You are here</Popup>
              </Marker>
            </MapContainer>
          </section>

          <div className="glass p-6 rounded-[24px]">
             <h3 className="font-bold text-lg text-white mb-4">Patient Info</h3>
             <p className="text-white/60 text-sm mb-4">Emergency: <span className="text-orange-400">{activeJob.services?.name || 'Assistance'}</span></p>
             <button 
                onClick={completeJob}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-colors text-white font-bold tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
             >
                <CheckCircle className="w-5 h-5" /> Mark as Completed
             </button>
          </div>
        </div>
      );
  }

  return (
    <div className="p-4 space-y-6 pb-32">
      <h1 className="text-2xl font-bold mt-4 text-white">Live Requests</h1>
      
      <div className="space-y-4">
        <AnimatePresence>
          {requests.length === 0 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-white/50 glass rounded-[32px]">
               <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 mx-auto flex items-center justify-center mb-4">
                  <Navigation className="w-6 h-6 text-white/30" />
               </div>
               <p>No pending jobs right now.</p>
               <p className="text-xs">We'll alert you when someone needs help.</p>
             </motion.div>
          )}
          
          {requests.map((r, i) => (
            <motion.div 
              key={r.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
              className="glass p-0 rounded-[24px] overflow-hidden border border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] relative"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-red-500" />
              <div className="p-5 pl-6">
                <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="font-bold text-xl text-orange-400">{r.services?.name || 'Emergency Assistance'}</h3>
                     <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> 2.4 km away directly
                     </p>
                   </div>
                   <div className="bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full animate-pulse border border-red-500/30">
                     Urgent
                   </div>
                </div>

                <div className="bg-black/40 p-4 rounded-[16px] flex items-center gap-3 mb-6 border border-white/5">
                  <Navigation className="w-5 h-5 text-white/40 flex-shrink-0" />
                  <p className="text-sm min-w-0">
                    <span className="text-white/60 block mb-1">GPS Location</span>
                    <span className="text-xs text-white/80 font-mono truncate block">{r.user_location?.lat}, {r.user_location?.lng}</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDecline(r.id)}
                    className="flex-[0.5] py-3 rounded-xl glass hover:bg-white/10 transition-colors text-sm font-semibold flex items-center justify-center gap-2 text-white/70"
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </button>
                  <button 
                    onClick={() => handleAccept(r.id)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition-colors text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" /> ACCEPT JOB
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
