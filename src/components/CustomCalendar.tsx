import React, { useState } from 'react';
import { 
 format, 
 addMonths, 
 subMonths, 
 startOfMonth, 
 endOfMonth, 
 startOfWeek, 
 endOfWeek, 
 isSameMonth, 
 isSameDay, 
 addDays, 
 eachDayOfInterval,
 isToday,
 setYear,
 setMonth,
 getYear
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomCalendarProps {
 selectedDate: string;
 onSelect: (date: string) => void;
 onClose: () => void;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({ selectedDate, onSelect, onClose }) => {
 const [currentMonth, setCurrentMonth] = useState(new Date());
 const selected = selectedDate ? new Date(selectedDate) : new Date();

 const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
 const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

 const renderHeader = () => {
 return (
 <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-50">
 <div className="flex items-center gap-4">
 <div className="flex flex-col">
 <span className="text-xl font-bold text-ink-black uppercase tracking-tight">
 {format(currentMonth, 'MMMM yyyy')}
 </span>
 <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-[0.2em]">
 {format(new Date(), 'EEEE, do MMMM')}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={prevMonth}
 className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-400"
 >
 <ChevronLeft className="w-5 h-5" />
 </button>
 <button
 onClick={() => setCurrentMonth(new Date())}
 className="px-3 py-1 text-[10px] font-bold text-ink-black uppercase tracking-widest hover:bg-zinc-50 rounded-lg transition-colors"
 >
 Today
 </button>
 <button
 onClick={nextMonth}
 className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-400"
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 </div>
 );
 };

 const renderDays = () => {
 const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
 return (
 <div className="grid grid-cols-7 mb-2">
 {days.map((day) => (
 <div key={day} className="text-center text-[10px] font-bold text-zinc-300 py-4 tracking-widest">
 {day}
 </div>
 ))}
 </div>
 );
 };

 const renderCells = () => {
 const monthStart = startOfMonth(currentMonth);
 const monthEnd = endOfMonth(monthStart);
 const startDate = startOfWeek(monthStart);
 const endDate = endOfWeek(monthEnd);

 const rows = [];
 let days = [];
 let day = startDate;
 let formattedDate = "";

 while (day <= endDate) {
 for (let i = 0; i < 7; i++) {
 formattedDate = format(day, 'd');
 const cloneDay = day;
 const isCurrentMonth = isSameMonth(day, monthStart);
 const isSelected = isSameDay(day, selected);
 const isTodayDay = isToday(day);

 days.push(
 <div
 key={day.toString()}
 className={`relative h-14 flex items-center justify-center cursor-pointer group transition-all`}
 onClick={() => {
 onSelect(format(cloneDay, 'yyyy-MM-dd'));
 onClose();
 }}
 >
 {isSelected && (
 <motion.div 
 layoutId="activeDay"
 className="absolute inset-2 border-2 border-ink-black rounded-xl z-0" 
 />
 )}
 {isTodayDay && !isSelected && (
 <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
 )}
 <span className={`relative z-10 text-sm font-bold ${
 !isCurrentMonth ? 'text-zinc-200' : 
 isSelected ? 'text-ink-black' : 
 isTodayDay ? 'text-orange-500' : 'text-zinc-800'
 }`}>
 {formattedDate}
 </span>
 </div>
 );
 day = addDays(day, 1);
 }
 rows.push(
 <div className="grid grid-cols-7" key={day.toString()}>
 {days}
 </div>
 );
 days = [];
 }
 return <div className="px-2 pb-4">{rows}</div>;
 };

 return (
 <div className="bg-white rounded-[32px] shadow-2xl border border-zinc-100 overflow-hidden w-[360px] max-w-full">
 {renderHeader()}
 {renderDays()}
 {renderCells()}
 </div>
 );
};
