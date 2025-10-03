'use client';

import { RoutineItem } from '@/types';
import { CheckCircle, Circle, Clock, Star } from 'lucide-react';

interface RoutineListProps {
  routines: RoutineItem[];
  nextItem: RoutineItem | null;
  onToggleComplete: (routineId: string) => void;
}

export function RoutineList({ routines, nextItem, onToggleComplete }: RoutineListProps) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const getItemStatus = (item: RoutineItem) => {
    if (item.completed) return 'completed';
    if (item.id === nextItem?.id) return 'next';
    if (item.time <= currentTime) return 'overdue';
    return 'upcoming';
  };

  const getItemStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'next':
        return 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-200 animate-pulse';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'upcoming':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-white border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6 text-gray-600" />
        <h3 className="text-xl trml:text-2xl font-bold text-gray-800">
          Today's Routine
        </h3>
      </div>

      <div className="space-y-3">
        {routines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No routines for today!</p>
            <p className="text-sm">Enjoy your free day! 🎉</p>
          </div>
        ) : (
          routines.map((item) => {
            const status = getItemStatus(item);
            const styles = getItemStyles(status);

            return (
              <div
                key={item.id}
                className={`
                  border rounded-xl p-4 trml:p-5 transition-all cursor-pointer
                  hover:shadow-md ${styles} todo-item
                `}
                onClick={() => onToggleComplete(item.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Completion Status */}
                  <div className="flex-shrink-0">
                    {item.completed ? (
                      <CheckCircle className="w-6 h-6 trml:w-8 trml:h-8 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 trml:w-8 trml:h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`
                        text-lg trml:text-xl font-semibold
                        ${item.completed ? 'line-through text-gray-500' : ''}
                      `}>
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm trml:text-base font-mono font-medium">
                          {item.time}
                        </span>
                        {status === 'next' && (
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            NEXT
                          </span>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className={`
                        text-sm trml:text-base text-gray-600 mb-2
                        ${item.completed ? 'line-through' : ''}
                      `}>
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm trml:text-base font-medium">
                        {item.points} points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm trml:text-base text-gray-600">
          <span>
            Completed: {routines.filter(r => r.completed).length} / {routines.length}
          </span>
          <span>
            Total Points: {routines.reduce((sum, r) => sum + (r.completed ? r.points : 0), 0)}
          </span>
        </div>
      </div>
    </div>
  );
}