import { Request, Response } from 'express';
import { TimeEntry } from '../models/firestore/TimeEntry.js';
import { AuthRequestFirestore } from '../types/firestore.js';

// @desc    Get weekly time tracking report
// @route   GET /api/v2/reports/time-entries/weekly
// @access  Private
export const getWeeklyTimeReport = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Get current date or use provided date
    const referenceDate = req.query.date ? new Date(req.query.date as string) : new Date();
    
    // Calculate start of week (Monday)
    const startOfWeek = new Date(referenceDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Get time entries for the week
    const filters = {
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString()
    };
    
    const timeEntries = await TimeEntry.findByUser(req.user.id, filters);
    
    // Group by day of week
    const dailyData: { [key: string]: any } = {};
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        dayOfWeek: daysOfWeek[i],
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        entries: []
      };
    }
    
    // Process entries
    for (const entry of timeEntries) {
      const dateKey = typeof entry.date === 'string' 
        ? entry.date 
        : (entry.date as any).toDate().toISOString().split('T')[0];
      
      if (dailyData[dateKey]) {
        // Use hours if available, otherwise convert duration from seconds
        const hours = entry.hours || (entry.duration ? entry.duration / 3600 : 0);
        dailyData[dateKey].totalHours += hours;
        if (entry.isBillable) {
          dailyData[dateKey].billableHours += hours;
        } else {
          dailyData[dateKey].nonBillableHours += hours;
        }
        dailyData[dateKey].entries.push(entry);
      }
    }
    
    // Calculate weekly totals
    const totalHours = timeEntries.reduce((sum, entry) => {
      return sum + (entry.hours || (entry.duration ? entry.duration / 3600 : 0));
    }, 0);
    const billableHours = timeEntries.filter(e => e.isBillable).reduce((sum, entry) => {
      return sum + (entry.hours || (entry.duration ? entry.duration / 3600 : 0));
    }, 0);
    const nonBillableHours = timeEntries.filter(e => !e.isBillable).reduce((sum, entry) => {
      return sum + (entry.hours || (entry.duration ? entry.duration / 3600 : 0));
    }, 0);
    
    const weeklyTotal = {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
      totalHours: parseFloat(totalHours.toFixed(2)),
      billableHours: parseFloat(billableHours.toFixed(2)),
      nonBillableHours: parseFloat(nonBillableHours.toFixed(2)),
      totalEntries: timeEntries.length,
      dailyBreakdown: Object.values(dailyData)
    };
    
    res.status(200).json({
      success: true,
      data: weeklyTotal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get monthly time tracking report
// @route   GET /api/v2/reports/time-entries/monthly
// @access  Private
export const getMonthlyTimeReport = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Get year and month from query or use current
    const referenceDate = req.query.date ? new Date(req.query.date as string) : new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : referenceDate.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) - 1 : referenceDate.getMonth();
    
    // Calculate start and end of month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    // Get time entries for the month
    const filters = {
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString()
    };
    
    const timeEntries = await TimeEntry.findByUser(req.user.id, filters);
    
    // Group by week
    const weeklyData: { [key: string]: any } = {};
    
    // Process entries
    for (const entry of timeEntries) {
      const entryDate = typeof entry.date === 'string' 
        ? new Date(entry.date) 
        : (entry.date as any).toDate();
      
      // Calculate week number in month
      const weekOfMonth = Math.ceil(entryDate.getDate() / 7);
      const weekKey = `Week ${weekOfMonth}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          totalHours: 0,
          billableHours: 0,
          nonBillableHours: 0,
          entries: [],
          dailyAverage: 0
        };
      }
      
      const hours = entry.hours || (entry.duration ? entry.duration / 3600 : 0);
      weeklyData[weekKey].totalHours += hours;
      if (entry.isBillable) {
        weeklyData[weekKey].billableHours += hours;
      } else {
        weeklyData[weekKey].nonBillableHours += hours;
      }
      weeklyData[weekKey].entries.push(entry);
    }
    
    // Calculate daily averages for each week
    Object.values(weeklyData).forEach((week: any) => {
      const uniqueDays = new Set(week.entries.map((e: any) => 
        typeof e.date === 'string' ? e.date : e.date.toDate().toISOString().split('T')[0]
      ));
      week.dailyAverage = uniqueDays.size > 0 ? week.totalHours / uniqueDays.size : 0;
    });
    
    // Calculate monthly totals and statistics
    const totalHours = timeEntries.reduce((sum, entry) => {
      return sum + (entry.hours || (entry.duration ? entry.duration / 3600 : 0));
    }, 0);
    const billableHours = timeEntries.filter(e => e.isBillable).reduce((sum, entry) => {
      return sum + (entry.hours || (entry.duration ? entry.duration / 3600 : 0));
    }, 0);
    const nonBillableHours = timeEntries.filter(e => !e.isBillable).reduce((sum, entry) => {
      return sum + (entry.hours || (entry.duration ? entry.duration / 3600 : 0));
    }, 0);
    
    // Get unique working days
    const uniqueDays = new Set(timeEntries.map(e => 
      typeof e.date === 'string' ? e.date : (e.date as any).toDate().toISOString().split('T')[0]
    ));
    
    const monthlyTotal = {
      year,
      month: month + 1,
      monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      totalHours: parseFloat(totalHours.toFixed(2)),
      billableHours: parseFloat(billableHours.toFixed(2)),
      nonBillableHours: parseFloat(nonBillableHours.toFixed(2)),
      billablePercentage: totalHours > 0 ? (billableHours / totalHours * 100).toFixed(1) : '0',
      totalEntries: timeEntries.length,
      workingDays: uniqueDays.size,
      dailyAverage: uniqueDays.size > 0 ? parseFloat((totalHours / uniqueDays.size).toFixed(2)) : 0,
      weeklyBreakdown: Object.values(weeklyData).sort((a: any, b: any) => 
        parseInt(a.week.split(' ')[1]) - parseInt(b.week.split(' ')[1])
      )
    };
    
    res.status(200).json({
      success: true,
      data: monthlyTotal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};