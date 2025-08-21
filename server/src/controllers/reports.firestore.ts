import { Request, Response } from 'express';
import { TimeEntry } from '../models/firestore/TimeEntry.js';
import { Project } from '../models/firestore/Project.js';
import Expense from '../models/firestore/Expense.js';
import Invoice from '../models/firestore/Invoice.js';
import { Client } from '../models/firestore/Client.js';
import { AuthRequestFirestore } from '../types/firestore.js';

// Re-export weekly and monthly reports from separate file
export { getWeeklyTimeReport, getMonthlyTimeReport } from './reports-weekly-monthly.firestore.js';

// @desc    Get summary report
// @route   GET /api/v2/reports/summary
// @access  Private
export const getSummaryReport = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { startDate, endDate } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    // Get time entries
    const timeEntries = await TimeEntry.findByUser(req.user.id, filters);
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    // Get billable hours and revenue
    const billableEntries = timeEntries.filter(entry => entry.isBillable);
    const billableHours = billableEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    // Calculate revenue from billable entries
    let totalRevenue = 0;
    for (const entry of billableEntries) {
      if (entry.projectId) {
        const project = await Project.findById(entry.projectId);
        if (project && project.hourlyRate) {
          totalRevenue += (entry.duration || 0) * project.hourlyRate;
        }
      }
    }

    // Get expenses
    const totalExpenses = await Expense.getTotalByUser(req.user.id, filters);
    
    // Get invoices
    const invoices = await Invoice.findByUser(req.user.id, filters);
    const invoiceSummary = {
      total: invoices.length,
      draft: invoices.filter(inv => inv.status === 'draft').length,
      sent: invoices.filter(inv => inv.status === 'sent').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
      outstandingAmount: invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + (inv.total || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        totalHours,
        billableHours,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        invoices: invoiceSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get time entries report
// @route   GET /api/v2/reports/time-entries
// @access  Private
export const getTimeEntriesReport = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { startDate, endDate, groupBy = 'project' } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const timeEntries = await TimeEntry.findByUser(req.user.id, filters);

    if (groupBy === 'project') {
      // Group by project
      const projectGroups: { [key: string]: any } = {};
      
      for (const entry of timeEntries) {
        const projectId = entry.projectId || 'no-project';
        
        if (!projectGroups[projectId]) {
          let projectInfo = { id: projectId, name: 'No Project', client: null };
          
          if (entry.projectId) {
            const project = await Project.findById(entry.projectId);
            if (project) {
              projectInfo = {
                id: project.id!,
                name: project.name,
                client: null
              };
              
              if (project.clientId) {
                const client = await Client.findById(project.clientId);
                if (client) {
                  projectInfo.client = { id: client.id, name: client.name };
                }
              }
            }
          }
          
          projectGroups[projectId] = {
            project: projectInfo,
            totalHours: 0,
            billableHours: 0,
            entries: []
          };
        }
        
        projectGroups[projectId].totalHours += entry.duration || 0;
        if (entry.isBillable) {
          projectGroups[projectId].billableHours += entry.duration || 0;
        }
        projectGroups[projectId].entries.push(entry);
      }
      
      const reportData = Object.values(projectGroups);
      
      res.status(200).json({
        success: true,
        data: reportData
      });
    } else if (groupBy === 'date') {
      // Group by date
      const dateGroups: { [key: string]: any } = {};
      
      for (const entry of timeEntries) {
        const dateKey = typeof entry.date === 'string' ? entry.date : (entry.date as any).toDate().toISOString().split('T')[0];
        
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = {
            date: dateKey,
            totalHours: 0,
            billableHours: 0,
            entries: []
          };
        }
        
        dateGroups[dateKey].totalHours += entry.duration || 0;
        if (entry.isBillable) {
          dateGroups[dateKey].billableHours += entry.duration || 0;
        }
        dateGroups[dateKey].entries.push(entry);
      }
      
      const reportData = Object.values(dateGroups).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      res.status(200).json({
        success: true,
        data: reportData
      });
    } else {
      // Return raw entries
      res.status(200).json({
        success: true,
        data: timeEntries
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get expenses report
// @route   GET /api/v2/reports/expenses
// @access  Private
export const getExpensesReport = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { startDate, endDate } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const expenses = await Expense.findByUser(req.user.id, filters);
    const byCategory = await Expense.getByCategory(req.user.id, filters);
    const total = await Expense.getTotalByUser(req.user.id, filters);

    res.status(200).json({
      success: true,
      data: {
        total,
        byCategory,
        expenses,
        count: expenses.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get projects report
// @route   GET /api/v2/reports/projects
// @access  Private
export const getProjectsReport = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { startDate, endDate } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const projects = await Project.findByUser(req.user.id);
    const projectReports = [];

    for (const project of projects) {
      // Get time entries for this project
      const timeEntries = await TimeEntry.findByProject(project.id!, filters);
      const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const billableHours = timeEntries.filter(e => e.isBillable).reduce((sum, entry) => sum + (entry.duration || 0), 0);
      
      // Calculate revenue
      const revenue = billableHours * (project.hourlyRate || 0);
      
      // Get expenses for this project
      const expenses = await Expense.list({ projectId: project.id, ...filters });
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Get client info
      let client = null;
      if (project.clientId) {
        const clientData = await Client.findById(project.clientId);
        if (clientData) {
          client = { id: clientData.id, name: clientData.name };
        }
      }
      
      projectReports.push({
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          client
        },
        totalHours,
        billableHours,
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
        timeEntries: timeEntries.length
      });
    }

    // Sort by revenue descending
    projectReports.sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: projectReports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get clients report
// @route   GET /api/v2/reports/clients
// @access  Private
export const getClientsReport = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { startDate, endDate } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const clients = await Client.findByUser(req.user.id);
    const clientReports = [];

    for (const client of clients) {
      // Get projects for this client
      const projects = await Project.findByClient(client.id!);
      
      let totalHours = 0;
      let billableHours = 0;
      let revenue = 0;
      let projectCount = projects.length;
      
      // Calculate metrics for all projects
      for (const project of projects) {
        const timeEntries = await TimeEntry.findByProject(project.id!, filters);
        const projectTotalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        const projectBillableHours = timeEntries.filter(e => e.isBillable).reduce((sum, entry) => sum + (entry.duration || 0), 0);
        
        totalHours += projectTotalHours;
        billableHours += projectBillableHours;
        revenue += projectBillableHours * (project.hourlyRate || 0);
      }
      
      // Get invoices for this client
      const invoices = await Invoice.findByClient(client.id!);
      const invoiceSummary = {
        total: invoices.length,
        paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
        outstanding: invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + (inv.total || 0), 0)
      };
      
      clientReports.push({
        client: {
          id: client.id,
          name: client.name,
          email: client.email
        },
        projects: projectCount,
        totalHours,
        billableHours,
        revenue,
        invoices: invoiceSummary
      });
    }

    // Sort by revenue descending
    clientReports.sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: clientReports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};