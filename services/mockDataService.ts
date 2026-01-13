
import { Movement, DailyStats, MovementType } from '../types';
import { MAJOR_FIRMS, EXPERTISE_LIST, POSITIONS } from '../constants';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateMockMovements = (days: number = 30): Movement[] => {
  const movements: Movement[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Number of movements per day (0-5)
    const count = Math.floor(Math.random() * 6);
    for (let j = 0; j < count; j++) {
      const type: MovementType = Math.random() > 0.4 ? 'TRANSFER' : (Math.random() > 0.5 ? 'JOIN' : 'LEAVE');
      const lawyerName = `변호사 ${Math.floor(Math.random() * 1000)}`;
      
      const movement: Movement = {
        id: `move-${i}-${j}`,
        lawyerName,
        date: dateStr,
        type,
        position: getRandomItem(POSITIONS),
        expertise: [getRandomItem(EXPERTISE_LIST), getRandomItem(EXPERTISE_LIST)].filter((v, i, a) => a.indexOf(v) === i),
      };

      if (type === 'JOIN') {
        movement.toFirm = getRandomItem(MAJOR_FIRMS).name;
      } else if (type === 'LEAVE') {
        movement.fromFirm = getRandomItem(MAJOR_FIRMS).name;
      } else {
        const from = getRandomItem(MAJOR_FIRMS);
        let to = getRandomItem(MAJOR_FIRMS);
        while (to.id === from.id) to = getRandomItem(MAJOR_FIRMS);
        movement.fromFirm = from.name;
        movement.toFirm = to.name;
      }

      movements.push(movement);
    }
  }
  return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const calculateStats = (movements: Movement[]): DailyStats[] => {
  const statsMap: Record<string, DailyStats> = {};

  movements.forEach(m => {
    if (!statsMap[m.date]) {
      statsMap[m.date] = { date: m.date, joiners: 0, leavers: 0, transfers: 0 };
    }
    if (m.type === 'JOIN') statsMap[m.date].joiners++;
    else if (m.type === 'LEAVE') statsMap[m.date].leavers++;
    else if (m.type === 'TRANSFER') statsMap[m.date].transfers++;
  });

  return Object.values(statsMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
