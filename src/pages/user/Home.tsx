import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Truck, Fuel, CircleDot, Zap, Wrench, Search, Star, Clock, MapPin } from 'lucide-react';
import { cn, supabase } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const providerIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] flex items-center justify-center"><div class="w-1 h-1 bg-white rounded-full"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const ICONS: Record<string, React.ReactNode> = {
  'truck': <Truck className="w-6 h-6" />,
  'fuel': <Fuel className="w-6 h-6" />,
  'circle-dot': <CircleDot className="w-6 h-6" />,
  'zap': <Zap className="w-6 h-6" />,
  'wrench': <Wrench className="w-6 h-6" />
};

export default function UserHome() {
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState('Locating... GPS Active');
  const navigate = useNavigate();

  useEffect(() => {
    // Reverse Geocoding
    if (userLocation && userLocation.lat !== 0) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
        .then(res => res.json())
        .then(data => {
           if (data && data.address) {
             const addr = data.address;
             const shortName = addr.suburb || addr.neighbourhood || addr.road || addr.city || 'Current Location';
             const city = addr.city || addr.town || addr.county || '';
             setLocationName(`${shortName}${city && city !== shortName ? `, ${city}` : ''}`);
           }
        })
        .catch(e => console.error("Geocoding failed", e));
    }
  }, [userLocation]);

  useEffect(() => {
    // Force high accuracy GPS location extraction
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setUserLocation({ lat: 12.9716, lng: 77.5946 }); 
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    const fetchDB = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL) return;
      const { data: svc } = await supabase.from('services').select('*');
      if (svc) setServices(svc);

      // Fetch nearby available providers
      const { data: prov } = await supabase
        .from('providers')
        .select(`*, users(name)`)
        .eq('availability', true);
      
      if (prov) {
        // Mock distance calculation for UI purposes if lat/lng is provided
        const provWithDist = prov.map(p => ({
            ...p,
            latitude: p.latitude || userLocation?.lat || 12.9716,
            longitude: p.longitude || userLocation?.lng || 77.5946,
            distance: (Math.random() * 5 + 0.5).toFixed(1),
            eta: Math.floor(Math.random() * 20 + 5)
        }));
        setProviders(provWithDist.sort((a,b) => parseFloat(a.distance) - parseFloat(b.distance)));
      }
    };
    fetchDB();
  }, []);

  return (
    <div className="p-4 space-y-6 pb-32 animate-in fade-in duration-500">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 pt-4 pb-2 glass rounded-b-3xl -mx-4 px-4 flex items-center justify-between shadow-lg">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest flex items-center gap-1 mb-0.5">
            <MapPin className="w-3 h-3 text-orange-400" /> Current Location
          </p>
          <h2 className="text-lg font-bold truncate text-white">{locationName}</h2>
        </div>
        <button 
          onClick={() => alert("Search area feature unlocks in full production deploy.")}
          className="w-10 h-10 rounded-full glass flex flex-shrink-0 items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* OpenStreetMap View */}
      <section className="relative w-full rounded-[24px] overflow-hidden glass shadow-2xl p-1 border border-white/20 z-0">
        <h3 className="text-sm font-semibold mb-2 ml-2 mt-1 text-white/80">Live Area Map</h3>
        {userLocation ? (
          <div className="rounded-[20px] overflow-hidden relative z-0 h-[250px]">
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={14}
              style={{ width: '100%', height: '100%', zIndex: 0 }}
              zoomControl={false}
            >
              {/* Dark mode OSM tiles via Carto */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
              {providers.map(p => (
                <Marker 
                  key={p.id} 
                  position={[parseFloat(p.latitude) || (userLocation.lat + 0.01), parseFloat(p.longitude) || (userLocation.lng + 0.01)]} 
                  icon={providerIcon}
                >
                  <Popup className="text-black font-bold rounded-lg shadow-xl border-none">
                    {p.users?.name || 'Provider'}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <div className="w-full h-[250px] bg-black/40 rounded-[20px] flex items-center justify-center">
             <p className="text-white/50">Locating GPS...</p>
          </div>
        )}
      </section>

      {/* Services Grid (Swiggy Style) */}
      <section>
        <h3 className="text-lg font-bold mb-4 text-white">What do you need?</h3>
        <div className="grid grid-cols-4 gap-4">
          {services.map((s, i) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/sos?service=${s.id}&name=${encodeURIComponent(s.name)}&icon=${s.icon}`)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-orange-500 hover:text-white transition-all duration-300 shadow-xl border border-white/20 bg-gradient-to-b hover:from-orange-500 hover:to-red-500">
                {ICONS[s.icon] || <Wrench className="w-6 h-6" />}
              </div>
              <span className="text-xs text-center font-semibold text-white/80">{s.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Nearby Providers */}
      <section>
        <h3 className="text-lg font-bold mb-4 text-white">Active Providers Nearby</h3>
        <div className="grid gap-4">
          {providers.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-4 rounded-[24px] flex gap-4 items-center shadow-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex flex-shrink-0 items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <Truck className="w-8 h-8 text-white relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg truncate text-white">{p.users?.name || 'Provider'}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/70 font-medium tracking-wide">
                  <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-sm">
                    <Star className="w-3 h-3 fill-current" /> {p.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    {p.distance} km
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Clock className="w-3 h-3" /> {p.eta} min
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          {providers.length === 0 && (
             <div className="glass p-8 text-center rounded-[24px] text-white/50">
               No providers available right now.
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

