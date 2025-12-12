import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { MonsterService } from '../services/MonsterService';
import type { Monster } from '../services/MonsterService';
import CombatOverlay from './CombatOverlay';

// Helper to create custom "Spirit Orb" icons
const createOrbIcon = (type: 'MINION' | 'BOSS') => {
    return divIcon({
        className: 'custom-div-icon', // Empty class to remove default leaflet styles
        html: `<div class="spirit-orb ${type === 'BOSS' ? 'boss' : ''}"></div>`,
        iconSize: type === 'BOSS' ? [28, 28] : [20, 20],
        iconAnchor: type === 'BOSS' ? [14, 14] : [10, 10]
    });
};

const UserIcon = divIcon({
    className: 'custom-div-icon',
    html: `<div style="background:blue; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 0 4px rgba(0,0,255,0.2);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Component to fly to user location on load
function LocationPan({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(position, 16); // Zoom in slightly more for immersive view
    }, [position, map]);
    return null;
}

export default function GameMap() {
    const [userPosition, setUserPosition] = useState<[number, number]>([39.9163, 116.3972]);
    const [monsters, setMonsters] = useState<Monster[]>([]);
    const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
    const [isInCombat, setIsInCombat] = useState(false);

    // Inventory State
    const [inventory, setInventory] = useState<{ name: string, type: 'PET' | 'ITEM', count: number }[]>([]);

    // 1. Get User Location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition((pos) => {
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserPosition(newPos);
            }, (err) => {
                console.warn("Location access denied", err);
            }, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            });
        }
    }, []);

    // Track last spawn position to avoid depending on 'monsters' state in useEffect
    const lastSpawnPos = useRef<[number, number] | null>(null);

    // 2. Spawn Monsters when user moves significantly or on init
    useEffect(() => {
        let shouldSpawn = false;

        if (!lastSpawnPos.current) {
            shouldSpawn = true;
        } else {
            // Check if user has moved far away (approx > 2km, 0.02 deg) from the last spawn point
            const distLat = Math.abs(userPosition[0] - lastSpawnPos.current[0]);
            const distLng = Math.abs(userPosition[1] - lastSpawnPos.current[1]);
            if (distLat > 0.02 || distLng > 0.02) {
                shouldSpawn = true;
            }
        }

        if (shouldSpawn) {
            console.log("Spawning monsters around:", userPosition);
            const newMonsters = MonsterService.spawnMonstersAround(userPosition, 8);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMonsters(newMonsters);
            lastSpawnPos.current = userPosition;
        }
    }, [userPosition]); // Re-run when user moves

    const handleMonsterClick = (m: Monster) => {
        setSelectedMonster(m);
    };

    const handleBattleStart = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!selectedMonster) return;
        setIsInCombat(true);
    };

    const handleCombatClose = () => {
        setIsInCombat(false);
        // Do not clear selectedMonster immediately so interaction range is easier to manage
    };

    const handleCombatWin = (defeatedMonster: Monster) => {
        // Logic: Add to inventory, remove from map
        setInventory(prev => {
            const exists = prev.find(i => i.name === defeatedMonster.name);
            if (exists) {
                return prev.map(i => i.name === defeatedMonster.name ? { ...i, count: i.count + 1 } : i);
            }
            return [...prev, { name: defeatedMonster.name, type: 'PET', count: 1 }];
        });

        // Remove monster from map
        setMonsters(prev => prev.filter(m => m.id !== defeatedMonster.id));

        setIsInCombat(false);
        setSelectedMonster(null);
        // alert(`收获颇丰！已将 [${defeatedMonster.name}] 收入囊中！`);
        console.log(`Captured ${defeatedMonster.name}`);
    };

    const manualRefresh = () => {
        console.log("Manual refresh clicked");
        const newMonsters = MonsterService.spawnMonstersAround(userPosition, 8);
        setMonsters(newMonsters);
    };

    console.debug(`Render: Monsters=${monsters.length}, UserPos=${userPosition}, Selected=${selectedMonster?.name}`);

    return (
        <>
            <MapContainer
                center={userPosition}
                zoom={16}
                style={{ height: "100%", width: "100%", background: "#f0e6d2" }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap & CartoDB'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                <LocationPan position={userPosition} />

                {/* User Marker */}
                <Marker position={userPosition} icon={UserIcon} zIndexOffset={1000} />

                {/* Interaction Range Indicator */}
                <Circle
                    center={userPosition}
                    radius={200}
                    pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1, dashArray: '4, 4' }}
                />

                {/* Monsters - Using Spirit Orbs */}
                {monsters.map(m => (
                    <Marker
                        key={m.id}
                        position={m.position}
                        icon={createOrbIcon(m.type)}
                        eventHandlers={{
                            click: (e) => {
                                e.originalEvent.stopPropagation();
                                handleMonsterClick(m);
                            }
                        }}
                    >
                    </Marker>
                ))}
            </MapContainer>

            {/* UI Header: Stats & Inventory */}
            <div className="pointer-events-none absolute top-4 left-4 right-4 z-[1002] flex justify-between items-start">
                {/* Top Left: Title & Stats */}
                <div className="ui-element parchment-card p-3 max-w-xs pointer-events-auto">
                    <h1 className="text-xl font-bold text-stone-900 tracking-widest" style={{ fontFamily: "LiSu, STKaiti, serif" }}>山河图 v1.1</h1>
                    <div className="text-xs text-stone-700 mt-2 font-medium">
                        <p>🎒 灵兽/宝物: {inventory.reduce((acc, curr) => acc + curr.count, 0)}</p>
                        {inventory.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-stone-400/30 max-h-32 overflow-y-auto">
                                {inventory.map((item, idx) => (
                                    <div key={idx} className="flex justify-between py-0.5">
                                        <span>{item.name}</span>
                                        <span className="font-bold">x{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Right: Refresh Button */}
                <button
                    onClick={manualRefresh}
                    className="ui-element parchment-card px-4 py-2 text-stone-800 font-bold text-sm hover:bg-[#e6dcc0] active:scale-95 transition-all pointer-events-auto"
                >
                    ↻ 觅妖 (Scan)
                </button>
            </div>

            {/* Monster Profile Card */}
            {!isInCombat && selectedMonster && (
                <div className="pointer-events-none absolute bottom-12 left-0 w-full flex justify-center z-[1002]">
                    <div className="ui-element parchment-card p-5 w-80 relative animate-in slide-in-from-bottom-5 pointer-events-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedMonster(null); }}
                            className="absolute -top-3 -right-3 bg-stone-800 text-[#f0e6d2] w-7 h-7 rounded-full border border-[#f0e6d2] shadow-md flex items-center justify-center hover:scale-110"
                        >
                            ✕
                        </button>

                        <div className="text-center space-y-3">
                            <div>
                                <h2 className="text-2xl font-bold text-stone-900 tracking-wide" style={{ fontFamily: "LiSu, STKaiti, serif" }}>
                                    {selectedMonster.name}
                                </h2>
                                {selectedMonster.type === 'BOSS' && <span className="text-[10px] bg-red-800 text-white px-1.5 py-0.5 rounded ml-2 align-middle">神兽 (BOSS)</span>}
                            </div>

                            <p className="text-stone-700 text-sm leading-relaxed border-y border-stone-400/20 py-2">
                                “{selectedMonster.description}”
                            </p>

                            <div className="flex justify-center pt-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleBattleStart(e); }}
                                    className="bg-stone-800 text-[#f0e6d2] px-8 py-2 rounded shadow-lg hover:bg-stone-700 active:scale-95 transition-all font-bold tracking-widest"
                                >
                                    ⚔️ 降 妖
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Combat Overlay */}
            {isInCombat && selectedMonster && (
                <CombatOverlay
                    monster={selectedMonster}
                    onClose={handleCombatClose}
                    onWin={handleCombatWin}
                />
            )}
        </>
    );
}
