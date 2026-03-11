import { Schedule, PaymentPlan } from '@prisma/client';

/**
 * Format time from 24-hour to 12-hour format
 * @param time - Time string in "HH:MM" format (e.g., "15:00")
 * @returns Formatted time (e.g., "3:00 PM")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format currency in Korean Won
 * @param amount - Amount in KRW
 * @returns Formatted currency string (e.g., "₩150,000")
 */
export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/**
 * Get Korean day name
 * @param day - Day of week (1=Monday, 5=Friday)
 * @returns Korean day name
 */
export function getDayName(day: number): string {
  const days = ['', '월요일', '화요일', '수요일', '목요일', '금요일'];
  return days[day] || '';
}

/**
 * Get short Korean day name
 * @param day - Day of week (1=Monday, 5=Friday)
 * @returns Short Korean day name
 */
export function getShortDayName(day: number): string {
  const days = ['', '월', '화', '수', '목', '금'];
  return days[day] || '';
}

/**
 * Get current day of week (1-5 for Mon-Fri, 0 for Sat/Sun)
 */
export function getCurrentDayOfWeek(): number {
  const day = new Date().getDay();
  // Sunday = 0, Saturday = 6
  if (day === 0 || day === 6) return 0;
  // Monday = 1, Tuesday = 2, etc.
  return day;
}

/**
 * Get current time in "HH:MM" format
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if current time is between start and end times
 */
export function isTimeBetween(current: string, start: string, end: string): boolean {
  return current >= start && current <= end;
}

/**
 * Find current active schedule
 * @param schedules - Array of schedules for today
 * @param currentTime - Current time in "HH:MM" format
 */
export function getCurrentSchedule(
  schedules: (Schedule & { academy: { name: string } })[],
  currentTime: string
): (Schedule & { academy: { name: string } }) | null {
  return schedules.find(s => isTimeBetween(currentTime, s.startTime, s.endTime)) || null;
}

/**
 * Find next schedule from today's schedules
 * @param schedules - Array of schedules for today
 * @param currentTime - Current time in "HH:MM" format
 */
export function getNextSchedule(
  schedules: (Schedule & { academy: { name: string } })[],
  currentTime: string
): (Schedule & { academy: { name: string } }) | null {
  const upcoming = schedules.filter(s => s.startTime > currentTime);
  return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * Find next schedule including future days (used when no more schedules today)
 * @param allSchedules - All schedules grouped by day
 * @param currentDay - Current day of week (1-5)
 * @param currentTime - Current time in "HH:MM" format
 */
export function getNextScheduleAcrossDays(
  allSchedules: Record<number, (Schedule & { academy: { name: string; id: number } })[]>,
  currentDay: number,
  currentTime: string
): ((Schedule & { academy: { name: string; id: number } }) & { dayOfWeek: number }) | null {
  // First check if there's any remaining schedule today
  const todaySchedules = allSchedules[currentDay] || [];
  const todayNext = todaySchedules.find(s => s.startTime > currentTime);
  if (todayNext) {
    return { ...todayNext, dayOfWeek: currentDay };
  }

  // Check future days (starting from tomorrow)
  for (let i = 1; i <= 5; i++) {
    const nextDay = ((currentDay - 1 + i) % 5) + 1; // Cycle through 1-5
    if (nextDay === currentDay) continue; // Skip current day

    const daySchedules = allSchedules[nextDay] || [];
    if (daySchedules.length > 0) {
      // Return first schedule of that day
      return { ...daySchedules[0], dayOfWeek: nextDay };
    }
  }

  return null;
}

/**
 * Get upcoming payments for this month
 * @param paymentPlans - Array of payment plans
 */
export function getUpcomingPayments(
  paymentPlans: (PaymentPlan & { academy: { name: string } })[]
): (PaymentPlan & { academy: { name: string }; daysUntil: number })[] {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return paymentPlans
    .filter(p => p.cycle === 'MONTH')
    .map(p => {
      let paymentDate = new Date(currentYear, currentMonth, p.paymentDay);

      // If payment day has passed this month, show next month
      if (p.paymentDay < currentDay) {
        paymentDate = new Date(currentYear, currentMonth + 1, p.paymentDay);
      }

      const daysUntil = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...p,
        daysUntil,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Group schedules by day of week
 */
export function groupSchedulesByDay(
  schedules: (Schedule & { academy: { name: string; id: number } })[]
): Record<number, (Schedule & { academy: { name: string; id: number } })[]> {
  const grouped: Record<number, (Schedule & { academy: { name: string; id: number } })[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  schedules.forEach(schedule => {
    if (schedule.dayOfWeek >= 1 && schedule.dayOfWeek <= 5) {
      grouped[schedule.dayOfWeek].push(schedule);
    }
  });

  // Sort each day's schedules by start time
  Object.keys(grouped).forEach(day => {
    grouped[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return grouped;
}
