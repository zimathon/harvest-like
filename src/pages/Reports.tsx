import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Select,
  Grid,
  GridItem,
  Card,
  CardBody,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  FormControl,
  FormLabel,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Badge,
  useToast
} from '@chakra-ui/react'
import { useState, useCallback, useMemo } from 'react'
import { useProjects } from '../contexts/ProjectContext'
import { useUsers } from '../contexts/UserContext'
import { useAuth } from '../contexts/AuthContext'
import timeEntryService from '../services/timeEntryService'
import { TimeEntry } from '../types'
import { formatHours } from '../utils/timeFormat'

// Helper function to format date with day of week
const formatDateWithDay = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return {
    formatted: `${year}/${month}/${day}`,
    dayOfWeek: days[date.getDay()],
    isWeekend: date.getDay() === 0 || date.getDay() === 6
  };
}

const Reports = () => {
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { users, isLoading: usersLoading, error: usersError } = useUsers();
  const { user } = useAuth();
  const toast = useToast();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [reportData, setReportData] = useState<TimeEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Calculate date range
  const getDateRange = useCallback(() => {
    // Always use selected year and month
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth, 0);
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    };
  }, [selectedYear, selectedMonth]);

  // Generate report
  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const dateRangeParams = getDateRange();
      const params: any = {
        ...dateRangeParams
      };
      
      if (selectedProject !== 'all') {
        params.project = selectedProject;
      }
      
      if (selectedUser !== 'all' && user?.role === 'admin') {
        params.user = selectedUser;
      }
      
      // Fetch time entries based on user role
      const entries = await timeEntryService.getMyTimeEntries(params);
      
      // デバッグログ
      console.log('Report entries:', entries.slice(0, 3).map(e => ({
        date: e.date,
        hours: e.hours,
        duration: e.duration,
        project: e.project?.name || e.projectName,
        isBillable: e.isBillable
      })));
      
      setReportData(entries);
      setReportGenerated(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProject, selectedUser, user, getDateRange]);

  // Aggregate data by project
  const projectSummary = useMemo(() => {
    const summary = reportData.reduce((acc, entry) => {
      const projectId = entry.project?.id || entry.projectId || '';
      if (!acc[projectId]) {
        acc[projectId] = {
          project: entry.project || { id: projectId, name: entry.projectName || 'Unknown' },
          totalHours: 0,
          billableHours: 0,
          entries: 0,
          users: new Set()
        };
      }
      
      // hoursフィールドがある場合はそれを使用、なければdurationを秒から時間に変換
      const hours = entry.hours || ((entry.duration || 0) / 3600);
      acc[projectId].totalHours += hours;
      if (entry.isBillable) {
        acc[projectId].billableHours += hours;
      }
      acc[projectId].entries += 1;
      acc[projectId].users.add(entry.userId);
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(summary).map(item => ({
      ...item,
      userCount: item.users.size
    }));
  }, [reportData]);

  // Daily entries sorted by date
  const dailyEntries = useMemo(() => {
    return reportData
      .map(entry => {
        const hours = entry.hours || ((entry.duration || 0) / 3600);
        return {
          ...entry,
          calculatedHours: hours,
          projectName: entry.project?.name || entry.projectName || 'Unknown'
        };
      })
      .sort((a, b) => {
        // Sort by date (descending), then by project name
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.projectName.localeCompare(b.projectName);
      });
  }, [reportData]);

  // Calculate total statistics
  const totalStats = useMemo(() => {
    return projectSummary.reduce((acc, project) => {
      acc.totalHours += project.totalHours;
      acc.billableHours += project.billableHours;
      acc.totalProjects += 1;
      return acc;
    }, { totalHours: 0, billableHours: 0, totalProjects: 0 });
  }, [projectSummary]);

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    if (!reportGenerated || reportData.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Please generate a report first',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    let csvContent = '';
    let filename = '';

    // Export based on active tab
    if (activeTab === 1) {
      // Daily Breakdown
      csvContent = 'Date,Day,Project,Task,Notes,Hours,Type\n';
      dailyEntries.forEach(entry => {
        const dateInfo = formatDateWithDay(entry.date);
        const notes = entry.notes || entry.description || '-';
        csvContent += `"${dateInfo.formatted}","${dateInfo.dayOfWeek}","${entry.projectName}","${entry.task || '-'}","${notes}",${entry.calculatedHours.toFixed(2)},"${entry.isBillable ? 'Billable' : 'Non-Billable'}"\n`;
      });
      filename = 'daily-breakdown-report.csv';
    } else if (activeTab === 2) {
      // Project Summary
      csvContent = 'Project,Total Hours,Billable Hours,Non-Billable Hours,Billable %,Team Members\n';
      projectSummary.forEach(project => {
        const billablePercentage = project.totalHours > 0 ? (project.billableHours / project.totalHours) * 100 : 0;
        csvContent += `"${project.project.name}",${project.totalHours.toFixed(2)},${project.billableHours.toFixed(2)},${(project.totalHours - project.billableHours).toFixed(2)},${billablePercentage.toFixed(0)}%,${project.userCount}\n`;
      });
      filename = 'project-summary-report.csv';
    } else {
      // Time Summary - Export raw data
      csvContent = 'Date,Project,Task,Notes,Hours,Billable\n';
      reportData.forEach(entry => {
        const hours = entry.hours || ((entry.duration || 0) / 3600);
        csvContent += `"${entry.date}","${entry.project?.name || entry.projectName || 'Unknown'}","${entry.task || '-'}","${entry.notes || entry.description || '-'}",${hours.toFixed(2)},${entry.isBillable ? 'Yes' : 'No'}\n`;
      });
      filename = 'time-entries-report.csv';
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export successful',
      description: `Report exported as ${filename}`,
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  }, [reportGenerated, reportData, activeTab, dailyEntries, projectSummary]);

  if (projectsLoading || usersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (projectsError || usersError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading data: {projectsError || usersError}
      </Alert>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Reports</Heading>
      
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Report Parameters</Heading>
            <Grid templateColumns="repeat(4, 1fr)" gap={4}>
              <GridItem>
                <FormControl>
                  <FormLabel>Year</FormLabel>
                  <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>Month</FormLabel>
                  <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>Project</FormLabel>
                  <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                    <option value="all">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>Team Member</FormLabel>
                  <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                    <option value="all">All Team Members</option>
                    {Array.isArray(users) && users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>
            
            <HStack mt={6}>
              <Button 
                colorScheme="blue" 
                onClick={generateReport}
                isLoading={isGenerating}
                loadingText="Generating..."
              >
                Generate Report
              </Button>
              <Button 
                variant="outline"
                onClick={exportToCSV}
                isDisabled={!reportGenerated}
              >
                Export CSV
              </Button>
            </HStack>
          </CardBody>
        </Card>
        
        <Tabs variant="enclosed" onChange={(index) => setActiveTab(index)}>
          <TabList>
            <Tab>Time Summary</Tab>
            <Tab>Daily Breakdown</Tab>
            <Tab>Project Summary</Tab>
            <Tab>Team Summary</Tab>
            <Tab>Expenses</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Time Summary</Heading>
                    {!reportGenerated ? (
                      <Text>No data available. Please generate a report using the parameters above.</Text>
                    ) : (
                      <>
                        <StatGroup>
                          <Stat>
                            <StatLabel>Total Hours</StatLabel>
                            <StatNumber>{formatHours(totalStats.totalHours)}</StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Billable Hours</StatLabel>
                            <StatNumber>{formatHours(totalStats.billableHours)}</StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Total Projects</StatLabel>
                            <StatNumber>{totalStats.totalProjects}</StatNumber>
                          </Stat>
                        </StatGroup>
                      </>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Daily Breakdown</Heading>
                    {!reportGenerated ? (
                      <Text>No data available. Please generate a report using the parameters above.</Text>
                    ) : dailyEntries.length === 0 ? (
                      <Text>No time entries found for the selected criteria.</Text>
                    ) : (
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Date</Th>
                              <Th>Day</Th>
                              <Th>Project</Th>
                              <Th>Task</Th>
                              <Th isNumeric>Hours</Th>
                              <Th>Type</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {dailyEntries.map((entry, index) => {
                              const dateInfo = formatDateWithDay(entry.date);
                              return (
                                <Tr key={`${entry.id || index}`} bg={dateInfo.isWeekend ? 'gray.50' : undefined}>
                                  <Td>{dateInfo.formatted}</Td>
                                  <Td>
                                    <Badge colorScheme={dateInfo.isWeekend ? 'purple' : 'blue'}>
                                      {dateInfo.dayOfWeek}
                                    </Badge>
                                  </Td>
                                  <Td>{entry.projectName}</Td>
                                  <Td>{typeof entry.task === 'string' ? entry.task : (entry.task ? 'Task' : '-')}</Td>
                                  <Td isNumeric>{formatHours(entry.calculatedHours)}</Td>
                                  <Td>
                                    <Badge colorScheme={entry.isBillable ? 'green' : 'gray'}>
                                      {entry.isBillable ? 'Billable' : 'Non-Billable'}
                                    </Badge>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Project Summary</Heading>
                    {!reportGenerated ? (
                      <Text>No data available. Please generate a report using the parameters above.</Text>
                    ) : projectSummary.length === 0 ? (
                      <Text>No time entries found for the selected criteria.</Text>
                    ) : (
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Project</Th>
                              <Th isNumeric>Total Hours</Th>
                              <Th isNumeric>Billable Hours</Th>
                              <Th isNumeric>Non-Billable</Th>
                              <Th>Progress</Th>
                              <Th isNumeric>Team Members</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {projectSummary.map((project) => {
                              const billablePercentage = project.totalHours > 0 
                                ? (project.billableHours / project.totalHours) * 100 
                                : 0;
                              return (
                                <Tr key={project.project.id}>
                                  <Td>{project.project.name}</Td>
                                  <Td isNumeric>{formatHours(project.totalHours)}</Td>
                                  <Td isNumeric>{formatHours(project.billableHours)}</Td>
                                  <Td isNumeric>
                                    {formatHours(project.totalHours - project.billableHours)}
                                  </Td>
                                  <Td>
                                    <VStack align="stretch" spacing={1}>
                                      <Progress 
                                        value={billablePercentage} 
                                        size="sm" 
                                        colorScheme="green"
                                      />
                                      <Text fontSize="xs">
                                        {billablePercentage.toFixed(0)}% billable
                                      </Text>
                                    </VStack>
                                  </Td>
                                  <Td isNumeric>{project.userCount}</Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Team Summary for April 2025</Heading>
                    <Text>No data available. Please generate a report using the parameters above.</Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Expenses Summary for April 2025</Heading>
                    <Text>No data available. Please generate a report using the parameters above.</Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

export default Reports