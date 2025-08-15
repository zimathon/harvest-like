import { useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  HStack,
  VStack,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Spinner
} from '@chakra-ui/react';
import { useTimeEntries } from '../contexts/TimeEntryContext';
import { useProjects } from '../contexts/ProjectContext';
import { useExpenses } from '../contexts/ExpenseContext';

const Dashboard = () => {
  const { timeEntries, fetchTimeEntries, isLoading: timeLoading } = useTimeEntries();
  const { projects, fetchProjects, isLoading: projectsLoading } = useProjects();
  const { expenses, fetchExpenses, isLoading: expensesLoading } = useExpenses();
  
  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
    fetchExpenses();
  }, []);
  
  // 今日の日付
  const today = new Date().toISOString().split('T')[0];
  
  // 今日の時間
  const todayHours = useMemo(() => {
    const todayEntries = timeEntries.filter(entry => entry.date === today);
    
    // デバッグログ
    if (todayEntries.length > 0) {
      console.log('Today entries:', todayEntries.map(e => ({
        date: e.date,
        hours: e.hours,
        duration: e.duration,
        project: e.project?.name || e.projectName
      })));
    }
    
    return todayEntries.reduce((total, entry) => total + (entry.hours ? entry.hours * 3600 : (entry.duration || 0)), 0);
  }, [timeEntries, today]);
  
  // 今週の時間
  const weekHours = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 週の始まり（日曜日）
    
    return timeEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek;
      })
      .reduce((total, entry) => total + (entry.hours ? entry.hours * 3600 : (entry.duration || 0)), 0);
  }, [timeEntries]);
  
  // 今月の時間
  const monthHours = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return timeEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfMonth;
      })
      .reduce((total, entry) => total + (entry.hours ? entry.hours * 3600 : (entry.duration || 0)), 0);
  }, [timeEntries]);
  
  // 未請求金額（例として時間 * 100ドルで計算）
  const unbilledAmount = useMemo(() => {
    return timeEntries
      .filter(entry => entry.isBillable)
      .reduce((total, entry) => {
        const hours = entry.hours || ((entry.duration || 0) / 3600);
        return total + hours * 100;
      }, 0);
  }, [timeEntries]);
  
  // 最近の時間エントリー（最新5件）
  const recentTimeEntries = useMemo(() => {
    return [...timeEntries]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || '');
        const dateB = new Date(b.updatedAt || '');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [timeEntries]);
  
  // 最近の経費（最新5件）
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || '');
        const dateB = new Date(b.updatedAt || '');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [expenses]);
  
  
  
  // プロジェクトの進捗状況
  const projectProgress = useMemo(() => {
    return projects.map(project => {
      // プロジェクトの時間を集計（秒単位）
      const projectSeconds = timeEntries
        .filter(entry => (entry.project?.id === project.id) || (entry.projectId === project.id))
        .reduce((total, entry) => total + (entry.hours ? entry.hours * 3600 : (entry.duration || 0)), 0);
      
      // 時間に変換
      const projectHours = projectSeconds / 3600;
      
      // 予算に対する進捗率を計算（仮定として、予算が時間または金額で設定されているものとする）
      let progress = 0;
      if (project.budgetType === 'hourly') {
        // 時間ベースの予算
        progress = project.budget ? (projectHours / project.budget) * 100 : 0;
      } else {
        // 固定金額の予算
        const projectCost = projectHours * (project.hourlyRate || 100);
        progress = project.budget ? (projectCost / project.budget) * 100 : 0;
      }
      
      return {
        id: project.id,
        name: project.name,
        progress: Math.min(progress, 100),
        status: project.status
      };
    })
    .filter(p => p.status === 'active')
    .sort((a, b) => b.progress - a.progress) // 進捗率の高い順にソート
    .slice(0, 5); // 上位5件を表示
  }, [projects, timeEntries]);
  
  // 時間をフォーマット（秒から時間に変換）
  const formatHours = (duration: number) => {
    // duration is in seconds, convert to hours
    const hours = duration / 3600;
    return hours.toFixed(1);
  };
  
  // 金額をフォーマット
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // 日付をフォーマット
  const formatDate = (dateValue: string | undefined) => {
    if (!dateValue) return 'N/A';
    let date: Date;
    
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      // Invalid date - return empty string or placeholder
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // ローディング中の表示
  if (timeLoading || projectsLoading || expensesLoading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  return (
    <Box>
      <Heading mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Today's Hours</StatLabel>
              <StatNumber>{formatHours(todayHours)}</StatNumber>
              <StatHelpText>{formatDate(today)}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>This Week</StatLabel>
              <StatNumber>{formatHours(weekHours)}</StatNumber>
              <StatHelpText>Week of {
                formatDate(
                  new Date(
                    new Date().setDate(new Date().getDate() - new Date().getDay())
                  ).toISOString()
                )
              }</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>This Month</StatLabel>
              <StatNumber>{formatHours(monthHours)}</StatNumber>
              <StatHelpText>{
                new Date().toLocaleString('default', { month: 'long' })
              } {new Date().getFullYear()}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Unbilled Amount</StatLabel>
              <StatNumber>{formatAmount(unbilledAmount)}</StatNumber>
              <StatHelpText>{timeEntries.filter(e => e.isBillable).length} billable entries</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Recent Time Entries</Heading>
            {recentTimeEntries.length > 0 ? (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Project</Th>
                    <Th>Hours</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentTimeEntries.map(entry => (
                    <Tr key={entry.id}>
                      <Td>{formatDate(entry.date)}</Td>
                      <Td>{entry.project?.name || entry.projectName || 'Unknown Project'}</Td>
                      <Td>{formatHours(entry.hours ? entry.hours * 3600 : (entry.duration || 0))}</Td>
                      <Td>
                        {entry.isRunning ? (
                          <Badge colorScheme="green">Running</Badge>
                        ) : (
                          <Badge colorScheme="blue">Completed</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text>No entries yet</Text>
            )}
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Project Status</Heading>
            {projectProgress.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {projectProgress.map(project => (
                  <Box key={project.id}>
                    <HStack justify="space-between" mb={1}>
                      <Text>{project.name}</Text>
                      <Text fontWeight="medium">{project.progress.toFixed(0)}%</Text>
                    </HStack>
                    <Progress 
                      value={project.progress} 
                      colorScheme={
                        project.progress > 85 ? 'red' : 
                        project.progress > 60 ? 'yellow' : 
                        'green'
                      }
                      borderRadius="md"
                    />
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text>No active projects</Text>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Recent Expenses</Heading>
            {recentExpenses.length > 0 ? (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Category</Th>
                    <Th>Amount</Th>
                    <Th>Project</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentExpenses.map(expense => (
                    <Tr key={expense.id}>
                      <Td>{formatDate(expense.date)}</Td>
                      <Td>{expense.category}</Td>
                      <Td>{formatAmount(expense.amount)}</Td>
                      <Td>{expense.project?.name || 'Unknown Project'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text>No expenses yet</Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;