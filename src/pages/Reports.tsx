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
  StatGroup
} from '@chakra-ui/react'
import { useState, useCallback, useMemo } from 'react'
import { useProjects } from '../contexts/ProjectContext'
import { useUsers } from '../contexts/UserContext'
import { useAuth } from '../contexts/AuthContext'
import * as timeEntryService from '../services/timeEntryService'
import { TimeEntry } from '../types'

const Reports = () => {
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { users, isLoading: usersLoading, error: usersError } = useUsers();
  const { user } = useAuth();
  
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [reportData, setReportData] = useState<TimeEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Calculate date range
  const getDateRange = useCallback(() => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    switch (dateRange) {
      case 'today':
        return {
          startDate: startOfDay.toISOString().split('T')[0],
          endDate: endOfDay.toISOString().split('T')[0]
        };
      case 'thisWeek': {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfDay.toISOString().split('T')[0]
        };
      }
      case 'lastWeek': {
        const dayOfWeek = today.getDay();
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        return {
          startDate: startOfLastWeek.toISOString().split('T')[0],
          endDate: endOfLastWeek.toISOString().split('T')[0]
        };
      }
      case 'thisMonth': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfDay.toISOString().split('T')[0]
        };
      }
      case 'lastMonth': {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          startDate: startOfLastMonth.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0]
        };
      }
      default:
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
          endDate: endOfDay.toISOString().split('T')[0]
        };
    }
  }, [dateRange]);

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
      const entries = user?.role === 'admin' && selectedUser !== 'all' 
        ? await timeEntryService.getAllTimeEntries(params)
        : await timeEntryService.getMyTimeEntries(params);
      
      setReportData(entries);
      setReportGenerated(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [dateRange, selectedProject, selectedUser, user, getDateRange]);

  // Aggregate data by project
  const projectSummary = useMemo(() => {
    const summary = reportData.reduce((acc, entry) => {
      const projectId = entry.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: entry.project,
          totalHours: 0,
          billableHours: 0,
          entries: 0,
          users: new Set()
        };
      }
      
      acc[projectId].totalHours += entry.duration / 3600; // Convert seconds to hours
      if (entry.isBillable) {
        acc[projectId].billableHours += entry.duration / 3600; // Convert seconds to hours
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

  // Calculate total statistics
  const totalStats = useMemo(() => {
    return projectSummary.reduce((acc, project) => {
      acc.totalHours += project.totalHours;
      acc.billableHours += project.billableHours;
      acc.totalProjects += 1;
      return acc;
    }, { totalHours: 0, billableHours: 0, totalProjects: 0 });
  }, [projectSummary]);

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
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <GridItem>
                <FormControl>
                  <FormLabel>Date Range</FormLabel>
                  <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="custom">Custom Range</option>
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
              <Button variant="outline">Export</Button>
            </HStack>
          </CardBody>
        </Card>
        
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Time Summary</Tab>
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
                            <StatNumber>{totalStats.totalHours.toFixed(2)}</StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Billable Hours</StatLabel>
                            <StatNumber>{totalStats.billableHours.toFixed(2)}</StatNumber>
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
                                  <Td isNumeric>{project.totalHours.toFixed(2)}</Td>
                                  <Td isNumeric>{project.billableHours.toFixed(2)}</Td>
                                  <Td isNumeric>
                                    {(project.totalHours - project.billableHours).toFixed(2)}
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