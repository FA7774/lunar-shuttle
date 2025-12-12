import { useState } from 'react';
import type { Monster } from '../services/MonsterService';

interface CombatOverlayProps {
    monster: Monster;
    onClose: () => void;
    onWin: (monster: Monster) => void;
}

export default function CombatOverlay({ monster, onClose, onWin }: CombatOverlayProps) {
    const [combatLog, setCombatLog] = useState<string[]>([]);
    const [playerHp, setPlayerHp] = useState(100);
    const [monsterHp, setMonsterHp] = useState(monster.level * 20); // Scale HP by level
    const [combatState, setCombatState] = useState<'ACTIVE' | 'VICTORY' | 'DEFEAT'>('ACTIVE');

    const addToLog = (msg: string) => {
        setCombatLog(prev => [...prev.slice(-4), msg]); // Keep last 5 lines
    };

    // Manual Attack Handler
    const handleAttack = () => {
        if (combatState !== 'ACTIVE') return;

        // Player attacks
        const pDmg = Math.floor(Math.random() * 15) + 10;
        const newMonsterHp = Math.max(0, monsterHp - pDmg);
        setMonsterHp(newMonsterHp);
        addToLog(`你攻击了 [${monster.name}], 造成 ${pDmg} 点伤害!`);

        if (newMonsterHp <= 0) {
            setCombatState('VICTORY');
            addToLog(`[${monster.name}] 被击败了!`);
            return;
        }

        // Monster counter-attacks shortly after
        setTimeout(() => {
            // Monster attacks
            const mDmg = Math.floor(Math.random() * 8) + (monster.level * 2);
            setPlayerHp(prev => {
                const val = Math.max(0, prev - mDmg);
                if (val <= 0) {
                    setCombatState('DEFEAT');
                    addToLog(`你不敌 [${monster.name}], 败下阵来...`);
                }
                return val;
            });
            addToLog(`[${monster.name}] 反击, 对你造成 ${mDmg} 点伤害!`);
        }, 600);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#f0e6d2] w-full max-w-md rounded-xl shadow-2xl overflow-hidden border-4 border-stone-800">
                {/* Header */}
                <div className="bg-stone-800 text-amber-50 p-4 text-center">
                    <h2 className="text-2xl font-bold" style={{ fontFamily: "LiSu, serif" }}> VS {monster.name} </h2>
                    <p className="text-sm opacity-80">{monster.description}</p>
                </div>

                {/* HP Bars */}
                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between text-sm font-bold text-stone-800 mb-1">
                            <span>BOSS: {monster.name}</span>
                            <span>{monsterHp} HP</span>
                        </div>
                        <div className="w-full bg-stone-300 h-4 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-600 transition-all duration-500"
                                style={{ width: `${(monsterHp / (monster.level * 20)) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm font-bold text-stone-800 mb-1">
                            <span>YOU (修仙者)</span>
                            <span>{playerHp} HP</span>
                        </div>
                        <div className="w-full bg-stone-300 h-4 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-600 transition-all duration-500"
                                style={{ width: `${(playerHp / 100) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Combat Log */}
                <div className="bg-stone-900/10 m-4 p-4 rounded h-32 overflow-y-auto font-mono text-sm text-stone-800">
                    {combatLog.map((log, i) => (
                        <div key={i} className="mb-1">{log}</div>
                    ))}
                    {combatState === 'ACTIVE' && <div className="animate-pulse text-stone-500 text-xs mt-2">...等待行动...</div>}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-stone-400 bg-white/50 text-center">
                    {combatState === 'ACTIVE' ? (
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleAttack}
                                className="bg-red-800 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-red-700 active:scale-95 transition-all text-lg"
                            >
                                ⚔️ 攻击
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-stone-500 text-white px-4 py-2 rounded hover:bg-stone-600"
                            >
                                逃跑
                            </button>
                        </div>
                    ) : combatState === 'VICTORY' ? (
                        <div className="space-y-3">
                            <h3 className="text-xl text-amber-700 font-bold">战斗胜利!</h3>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => onWin(monster)}
                                    className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-amber-700 transform hover:scale-105 active:scale-95 transition-all"
                                >
                                    📥 捕捉 (Capture)
                                </button>
                                <button
                                    onClick={() => onWin(monster)}
                                    className="bg-stone-800 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-stone-700 transform hover:scale-105 active:scale-95 transition-all"
                                >
                                    💰 拾取道具 (Loot)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="text-xl text-stone-600 font-bold">战斗失败...</h3>
                            <button
                                onClick={onClose}
                                className="bg-stone-800 text-white px-8 py-2 rounded hover:bg-stone-700"
                            >
                                返回 (Back)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
