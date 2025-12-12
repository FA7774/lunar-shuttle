export interface Monster {
    id: string;
    name: string;
    type: 'BOSS' | 'MINION';
    level: number;
    position: [number, number]; // [lat, lng]
    description: string;
}

// Mock database of mythological creatures
const CREATURE_TEMPLATES = [
    { name: "鹿蜀 (Lu Shu)", description: "佩之宜子孙 (Brings fertility/good fortune)", type: 'MINION' },
    { name: "旋龟 (Xuan Gui)", description: "佩之不聋 (Cures deafness)", type: 'MINION' },
    { name: "帝江 (Di Jiang)", description: "神鸟，六足四翼 (Divine bird)", type: 'BOSS' },
    { name: "姜子牙 (Jiang Ziya)", description: "昆仑虚影 (Shadow of Kunlun)", type: 'BOSS' },
    { name: "九尾狐 (Nine-Tailed Fox)", description: "青丘之灵 (Spirit of Qingqiu)", type: 'BOSS' },
    { name: "尚付 (Shang Fu)", description: "三首六目 (Three heads, six eyes)", type: 'MINION' }
];

export class MonsterService {
    // Generate monsters around a center point (radius in degrees, approx 0.01 deg ~= 1km)
    static spawnMonstersAround(center: [number, number], count: number = 5): Monster[] {
        console.log("Spawn requested around:", center);
        const [centerLat, centerLng] = center;
        const monsters: Monster[] = [];

        for (let i = 0; i < count; i++) {
            // Random offset within ~500m
            const latOffset = (Math.random() - 0.5) * 0.01;
            const lngOffset = (Math.random() - 0.5) * 0.01;

            const template = CREATURE_TEMPLATES[Math.floor(Math.random() * CREATURE_TEMPLATES.length)];

            monsters.push({
                id: `monster-${i}-${Date.now()}`,
                name: template.name,
                type: template.type as 'BOSS' | 'MINION',
                level: Math.floor(Math.random() * 10) + 1,
                position: [centerLat + latOffset, centerLng + lngOffset],
                description: template.description
            });
        }
        return monsters;
    }
}
